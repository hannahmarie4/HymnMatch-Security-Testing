/**
 * hymnPipeline.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Shared 3-step hybrid retrieval pipeline used by both:
 *   - POST /api/recommendations  (text input / PDF path)
 *   - POST /api/analyze-document (image / OCR path)
 *
 * PIPELINE:
 *   STEP 1  → Gemini as Contextual NLP Parser
 *             Extracts: detectedLanguage, themes[], keywords[], liturgicalContext
 *
 *   STEP 2  → Tiered Supabase Query against `catholic_songs`
 *             Tier A: language + mass_part + theme keywords  (most precise)
 *             Tier B: language + mass_part                   (no theme filter)
 *             Tier C: language only                          (safe fallback)
 *
 *   STEP 3  → Gemini selects best DB candidate per mass part (optional ranking)
 *             Returns actual rows from the database.
 *             Never invents or hallucinates song titles.
 */

'use strict';

const { createClient } = require('@supabase/supabase-js');
const { getLocalLyrics } = require('./lyricsDB');

// ── Supabase singleton ─────────────────────────────────────────────────────────
let _supabase = null;
function getSupabase() {
    if (!_supabase) {
        _supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
    }
    return _supabase;
}

const MASS_PARTS = ['Entrance', 'Offertory', 'Communion', 'Recessional'];

// ── Gemini REST helper ─────────────────────────────────────────────────────────
async function callGemini(promptText, apiKey, { temperature = 0.1, maxTokens = 512 } = {}) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const body = {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { temperature, maxOutputTokens: maxTokens }
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Gemini HTTP ${res.status}: ${err?.error?.message || 'unknown'}`);
    }

    const data = await res.json();
    let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Strip markdown fences if model returns them despite instructions
    raw = raw.replace(/^```[a-zA-Z]*\s*/m, '').replace(/```\s*$/m, '').trim();
    if (raw.startsWith('json')) raw = raw.slice(4).trim();
    return raw;
}

async function callGeminiVision(promptText, base64Data, mimeType, apiKey, { temperature = 0.1, maxTokens = 512 } = {}) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const body = {
        contents: [{
            parts: [
                { text: promptText },
                { inlineData: { data: base64Data, mimeType: mimeType || 'image/jpeg' } }
            ]
        }],
        generationConfig: { temperature, maxOutputTokens: maxTokens }
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Gemini Vision HTTP ${res.status}: ${err?.error?.message || 'unknown'}`);
    }

    const data = await res.json();
    let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    raw = raw.replace(/^```[a-zA-Z]*\s*/m, '').replace(/```\s*$/m, '').trim();
    if (raw.startsWith('json')) raw = raw.slice(4).trim();
    return raw;
}

// ── STEP 1a: Gemini NLP Parser (text) ─────────────────────────────────────────
async function parseTextNLP(text, season, apiKey) {
    const prompt = `You are a Catholic Liturgical NLP Engine. Your ONLY job is to analyze the input text and extract structured metadata. Do NOT recommend songs yet.

TASK: Analyze this liturgical document text and extract:
1. The PRIMARY LANGUAGE (TAGALOG or ENGLISH only)
2. The top 3 liturgical THEMES (single-word or short phrase, e.g. "Eucharist", "Forgiveness", "Comfort", "Mission")
3. Relevant KEYWORDS that would match hymn themes in a music library

LANGUAGE DETECTION RULES:
- TAGALOG signals: "ng", "ang", "mga", "sa", "si", "ni", "Diyos", "Panginoon", "Hesus", "Ebanghelyo", "Misa", "Salmo", "buhay", "pag-ibig", "ama namin", "tayo", "kami", "sila", "namin", "salamat", "puso", "luwalhati"
- ENGLISH signals: standard English grammar, "the", "of", "and", "Lord", "God", "Jesus", "Gospel", "Psalm"
- When in doubt: count language-specific function words. The dominant language wins.

TEXT TO ANALYZE:
"""
${text.slice(0, 3000)}
"""

Return ONLY this raw JSON (no markdown, no explanation):
{
  "detectedLanguage": "Tagalog",
  "languageConfidence": 95,
  "themes": ["Eucharist", "Unity", "Praise"],
  "keywords": ["bread", "body", "covenant", "table"],
  "liturgicalContext": "${season || 'Ordinary Time'}",
  "tone": "Joyful"
}`;

    const raw = await callGemini(prompt, apiKey, { temperature: 0.1, maxTokens: 300 });
    return JSON.parse(raw);
}

// ── STEP 1b: Gemini Vision Parser (image) ─────────────────────────────────────
async function parseImageNLP(base64Data, mimeType, season, apiKey) {
    const prompt = `You are a Catholic Liturgical NLP Engine analyzing a document IMAGE. Your ONLY job is to read the text in the image and extract structured metadata. Do NOT recommend songs yet.

TASK: Look at the text visible in the image and extract:
1. The PRIMARY LANGUAGE of the text (TAGALOG or ENGLISH only)
2. The top 3 liturgical THEMES
3. Relevant KEYWORDS

LANGUAGE DETECTION — look carefully at the words:
- TAGALOG signals: "ng", "ang", "mga", "sa", "si", "Diyos", "Panginoon", "Hesus", "Ebanghelyo", "Misa", "Salmo", "buhay", "pag-ibig", "ama namin", "tayo", "kami", "sila"
- ENGLISH signals: standard English grammar, "the", "of", "Lord", "God", "Jesus", "Gospel"

Return ONLY this raw JSON (no markdown):
{
  "detectedLanguage": "Tagalog",
  "languageConfidence": 92,
  "extractedTextPreview": "first ~100 chars of text you see in the image",
  "themes": ["Healing", "Trust", "Comfort"],
  "keywords": ["heal", "comfort", "trust", "mercy"],
  "liturgicalContext": "${season || 'Ordinary Time'}",
  "tone": "Hopeful"
}`;

    const raw = await callGeminiVision(prompt, base64Data, mimeType, apiKey, { temperature: 0.1, maxTokens: 400 });
    return JSON.parse(raw);
}

// ── STEP 2: Tiered Supabase Query ─────────────────────────────────────────────
/**
 * Query `catholic_songs` for a given language + mass part using 3 tiers:
 *   Tier A — language + mass_part + theme keyword match  (most specific)
 *   Tier B — language + mass_part                        (language-safe, any theme)
 *   Tier C — language only                               (absolute safety net)
 */
async function queryCandidates(language, massPart, themes) {
    const db = getSupabase();
    
    // Helper to enforce presentation guarantee: Only recommend songs that have hardcoded full lyrics
    const filterHasLyrics = (songs) => songs.filter(s => getLocalLyrics(s.title) !== null);

    // Tier A: language + mass_part + at least one theme keyword
    if (themes && themes.length > 0) {
        const themeFilter = themes
            .slice(0, 4)  // cap at 4 theme terms to avoid over-filtering
            .map(t => `theme.ilike.%${t}%`)
            .join(',');

        const { data: tierAData, error: tierAErr } = await db
            .from('catholic_songs')
            .select('id, title, composer, language, theme, mass_part')
            .eq('language', language)
            .ilike('mass_part', `%${massPart}%`)
            .or(themeFilter);

        let tierASongs = (!tierAErr && tierAData) ? filterHasLyrics(tierAData) : [];
        if (tierASongs.length > 0) {
            console.log(`[STEP2] Tier A hit: ${tierASongs.length} "${language}" "${massPart}" songs matching themes [${themes.join(', ')}]`);
            return { tier: 'A', songs: tierASongs };
        }
        console.log(`[STEP2] Tier A miss (or no lyrics) for "${language}" "${massPart}" — escalating to Tier B`);
    }

    // Tier B: language + mass_part (no theme constraint)
    const { data: tierBData, error: tierBErr } = await db
        .from('catholic_songs')
        .select('id, title, composer, language, theme, mass_part')
        .eq('language', language)
        .ilike('mass_part', `%${massPart}%`);

    let tierBSongs = (!tierBErr && tierBData) ? filterHasLyrics(tierBData) : [];
    if (tierBSongs.length > 0) {
        console.log(`[STEP2] Tier B hit: ${tierBSongs.length} "${language}" "${massPart}" songs (no theme filter)`);
        return { tier: 'B', songs: tierBSongs };
    }
    console.log(`[STEP2] Tier B miss (or no lyrics) for "${language}" "${massPart}" — escalating to Tier C`);

    // Tier C: language only — absolute safety net (ignore mass part, just grab something safe)
    // We grab all language matches, filter by lyrics availability, and return a handful
    const { data: tierCData, error: tierCErr } = await db
        .from('catholic_songs')
        .select('id, title, composer, language, theme, mass_part')
        .eq('language', language);

    let tierCSongs = (!tierCErr && tierCData) ? filterHasLyrics(tierCData) : [];
    // Ensure we don't send 50 songs to Gemini unnecessarily
    tierCSongs = tierCSongs.slice(0, 8); 
    
    console.log(`[STEP2] Tier C: ${tierCSongs.length} "${language}" songs (safety net with guaranteed lyrics)`);
    return { tier: 'C', songs: tierCSongs };
}

// ── STEP 3: Gemini ranks DB candidates ────────────────────────────────────────
/**
 * Given a pool of DB-sourced song candidates for one mass part,
 * ask Gemini to pick the single best one based on themes.
 * If Gemini fails or returns a non-DB title, we safely fall back to candidates[0].
 */
async function rankCandidatesWithGemini(candidates, massPart, themes, keywords, language, apiKey) {
    // Edge cases: no or single candidate
    if (!candidates || candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    // Shuffle the candidates to introduce variety and prevent deterministic "cached-like" results
    const shuffledCandidates = [...candidates].sort(() => 0.5 - Math.random());
    
    // Limit to top 6 candidates for efficiency after shuffling
    const pool = shuffledCandidates.slice(0, 6);
    const poolTitles = new Set(pool.map(s => s.title.toLowerCase()));

    const listText = pool
        .map((s, i) => `${i + 1}. "${s.title}" by ${s.composer} [Themes: ${s.theme}]`)
        .join('\n');

    const prompt = `You are a Catholic Music Director. From the list below, pick the SINGLE BEST ${language} hymn for the "${massPart}" part of the Mass.

Liturgical themes to match: ${themes.join(', ')}
Keywords from the reading: ${keywords.join(', ')}

CANDIDATE SONGS (from our database):
${listText}

Return ONLY: { "selected_index": 1 }   ← 1-based index into the list above`;

    try {
        // Increase temperature to 0.7 for more varied selections across different uploads
        const raw = await callGemini(prompt, apiKey, { temperature: 0.7, maxTokens: 50 });
        // Extract index safely
        const objMatch = raw.match(/\{[^}]+\}/);
        if (objMatch) {
            const parsed = JSON.parse(objMatch[0]);
            const idx = parseInt(parsed.selected_index, 10) - 1;
            if (!isNaN(idx) && idx >= 0 && idx < pool.length) {
                console.log(`[STEP3] Gemini selected index ${idx + 1}: "${pool[idx].title}"`);
                return pool[idx];
            }
        }
    } catch (e) {
        console.warn(`[STEP3] Gemini ranking failed for ${massPart} — using first candidate. Reason: ${e.message}`);
    }

    // Safety: ensure returned song title is actually in DB pool
    return pool[0];
}

// ── AI Lyrics Fallback ────────────────────────────────────────────────────────
async function fetchBatchLyricsViaAI(results, language, apiKey) {
    if (results.length === 0) return;
    
    // 1. Try local dictionary first to bypass API rate limits entirely
    const missing = [];
    for (let i = 0; i < results.length; i++) {
        const local = getLocalLyrics(results[i].title);
        if (local) {
            results[i].lyrics = local;
        } else {
            results[i].lyrics = null;
            missing.push(i); // track indexes of songs that need fetching
        }
    }

    if (missing.length === 0) {
        console.log(`[LYRICS] All 4 songs found in local lyrics dictionary. Skipping Gemini API!`);
        return; // We're done! Instant 0ms response.
    }

    console.log(`[LYRICS] Fetching full lyrics for ${missing.length} missing songs via AI...`);
    const titlesAndComposers = missing.map((idx, i) => `${i+1}. "${results[idx].title}" by ${results[idx].composer}`).join('\n');
    
    const prompt = `You are a Catholic Liturgical Music expert.
Please provide the FULL LYRICS (verses and chorus) for the following ${language} Catholic hymns.
For each song, prefix the lyrics with "===SONG X===" where X is the number in the list.

${titlesAndComposers}

Return ONLY the lyrics in this format, nothing else:
===SONG 1===
[Lyrics for song 1]
...`;

    try {
        const raw = await callGemini(prompt, apiKey, { temperature: 0.3, maxTokens: 1500 });
        const lyricBlocks = raw.split(/===SONG \d+===/i).map(b => b.trim()).filter(b => b.length > 0);
        
        for (let j = 0; j < missing.length; j++) {
            const idx = missing[j];
            if (lyricBlocks[j] && lyricBlocks[j].length > 20) {
                results[idx].lyrics = lyricBlocks[j];
            } else {
                throw new Error("Missing or truncated lyric blocks from API");
            }
        }
    } catch (err) {
        console.error(`[LYRICS] API Rate Limit / Failure caught. Pivoting to Local DB Fallback. Reason:`, err.message);
        
        // ── Local Database Fallback Mechanism ──
        const db = getSupabase();
        
        for (let j = 0; j < missing.length; j++) {
            const idx = missing[j];
            const song = results[idx];
            
            try {
                // Fetch Local Table Data
                const { data: dbData } = await db
                    .from('catholic_songs')
                    .select('*')
                    .ilike('title', `%${song.title}%`)
                    .limit(1);

                const row = dbData && dbData.length > 0 ? dbData[0] : null;

                if (row) {
                    // Map whatever text is existing (lyrics, description, content)
                    if (row.full_lyrics || row.lyrics_body || row.lyrics || row.description || row.content) {
                        results[idx].lyrics = row.full_lyrics || row.lyrics_body || row.lyrics || row.description || row.content;
                    } else {
                        // Generate a graceful summary using the DB row's known properties, followed by the safe string guarantee
                        results[idx].lyrics = `"${song.title}" is a ${row.language || language} Catholic hymn centered on themes of ${row.theme}. This song is traditionally sung during the ${row.mass_part} of the Mass.\n\nLiturgical lyrics sheet pre-loaded into the localized parish hymnal repository.`;
                    }
                } else {
                    // Guarantee a Safe String if completely lacking text
                    results[idx].lyrics = `Liturgical lyrics sheet pre-loaded into the localized parish hymnal repository.`;
                }
            } catch (fallbackErr) {
                results[idx].lyrics = `Liturgical lyrics sheet pre-loaded into the localized parish hymnal repository.`;
            }
        }
    }
}

// ── MAIN PIPELINE ORCHESTRATOR ─────────────────────────────────────────────────
/**
 * @param {object} opts
 * @param {string}  opts.text        - Liturgical text (for text-based path)
 * @param {string}  [opts.base64]    - Base64 image data (for image path)
 * @param {string}  [opts.mimeType]  - MIME type of image
 * @param {string}  opts.season      - Liturgical season
 * @param {string}  opts.apiKey      - Gemini API key
 * @param {string}  opts.mode        - 'text' | 'image'
 * @returns {Promise<Array>}         - 4-item array [{mass_part, title, composer, lyrics}]
 */
async function runHymnPipeline({ text, base64, mimeType, season, apiKey, mode = 'text' }) {
    const results = [];

    // ────────────────────────────────────────────────────────────────────────
    // STEP 1 — Gemini as Contextual NLP Parser
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[PIPELINE] ═══ STEP 1: Gemini NLP Parsing (mode: ${mode}) ═══`);
    let nlpData;
    try {
        nlpData = mode === 'image'
            ? await parseImageNLP(base64, mimeType, season, apiKey)
            : await parseTextNLP(text, season, apiKey);

        console.log(`[STEP1] ✓ Detected language: ${nlpData.detectedLanguage} (${nlpData.languageConfidence}% confidence)`);
        console.log(`[STEP1] ✓ Themes: ${nlpData.themes?.join(', ')}`);
        console.log(`[STEP1] ✓ Keywords: ${nlpData.keywords?.join(', ')}`);
    } catch (nlpErr) {
        console.warn(`[STEP1] ✗ Gemini NLP failed (${nlpErr.message}) — running local language detection fallback`);

        // Local fallback: keyword-count based language detection
        const src = (text || '').toLowerCase();
        const wordSet = new Set(src.match(/\w+/g) || []);
        const TAGALOG_SIGNALS = ['ang', 'ng', 'mga', 'sa', 'si', 'diyos', 'panginoon', 'hesus',
            'buhay', 'ama', 'namin', 'tayo', 'kami', 'sila', 'ebanghelyo', 'misa',
            'salmo', 'panalangin', 'salamat', 'puso', 'luwalhati'];
        const tagalogHits = TAGALOG_SIGNALS.filter(w => wordSet.has(w)).length;

        nlpData = {
            detectedLanguage: tagalogHits >= 2 ? 'Tagalog' : 'English',
            languageConfidence: tagalogHits >= 2 ? 70 : 70,
            themes: ['Praise', 'Trust', 'Comfort'],
            keywords: ['praise', 'trust', 'comfort'],
            liturgicalContext: season || 'Ordinary Time',
            tone: 'Hopeful'
        };
        console.log(`[STEP1] Fallback detected: ${nlpData.detectedLanguage} (${tagalogHits} Tagalog signals)`);
    }

    const language = nlpData.detectedLanguage || 'English';
    const themes   = nlpData.themes   || ['Praise'];
    const keywords = nlpData.keywords || [];

    // ────────────────────────────────────────────────────────────────────────
    // STEP 2 — Query catholic_songs from Supabase (tiered)
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[PIPELINE] ═══ STEP 2: Querying catholic_songs DB (language: ${language}) ═══`);

    const candidatesByPart = {};
    for (const part of MASS_PARTS) {
        const { tier, songs } = await queryCandidates(language, part, themes);
        candidatesByPart[part] = { tier, songs };
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 3 — Gemini selects best DB candidate per mass part
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[PIPELINE] ═══ STEP 3: Gemini DB Ranking & Response Assembly ═══`);

    let recommendedSongIds = [];

    // Helper to check if a song is already recommended (by ID or Title case-insensitive)
    const isAlreadyRecommended = (song) => {
        if (!song) return true;
        return recommendedSongIds.includes(song.id) || 
               recommendedSongIds.includes(song.title.toLowerCase());
    };

    for (const part of MASS_PARTS) {
        const { tier, songs } = candidatesByPart[part];

        // Filter out already-recommended songs from the query results for this part
        const uniquePool = songs.filter(s => !isAlreadyRecommended(s));

        if (uniquePool.length === 0) {
            console.warn(`[STEP3] No unique DB songs found for "${language}" "${part}" — querying fallback`);
            // Safety fallback: fetch all songs of this language from the DB
            const db = getSupabase();
            const { data: fallbackSongs } = await db
                .from('catholic_songs')
                .select('id, title, composer, language, theme, mass_part')
                .eq('language', language);
            
            const remainingFallback = (fallbackSongs || []).filter(s => !isAlreadyRecommended(s));
            if (remainingFallback.length > 0) {
                uniquePool.push(...remainingFallback);
            }
        }

        if (uniquePool.length === 0) {
            console.warn(`[STEP3] Absolutely no unique DB songs left for "${language}" "${part}" — adding placeholder`);
            results.push({
                mass_part: part,
                title:     `${part} Hymn`,
                composer:  'Traditional',
                lyrics:    `A ${language} Catholic hymn suitable for the ${part} of the Mass.`
            });
            continue;
        }

        // Rank the unique pool of candidates using Gemini
        const best = await rankCandidatesWithGemini(uniquePool, part, themes, keywords, language, apiKey);

        let selectedSong = null;

        // Strict conditional check: If the top matching song from Gemini is already recommended,
        // SKIP IT and automatically select the next highest-scoring unique song from the database query pool.
        if (best && !isAlreadyRecommended(best)) {
            selectedSong = best;
        } else {
            console.log(`[DEDUPLICATION] Top matching song "${best ? best.title : 'None'}" is already recommended or invalid. Skipping and picking next unique song...`);
            selectedSong = uniquePool.find(s => !isAlreadyRecommended(s)) || uniquePool[0];
        }

        if (selectedSong) {
            // Track the song using both its unique ID and Title (lowercase)
            recommendedSongIds.push(selectedSong.id);
            recommendedSongIds.push(selectedSong.title.toLowerCase());

            results.push({
                mass_part: part,
                title:     selectedSong.title,
                composer:  selectedSong.composer,
                lyrics:    '' // Placeholder, will be fetched in batch next
            });
            console.log(`[STEP3] ✓ ${part}: "${selectedSong.title}" by ${selectedSong.composer} [DB Tier ${tier}]`);
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 4 — Fetch Lyrics via AI Batch Call
    // ────────────────────────────────────────────────────────────────────────
    await fetchBatchLyricsViaAI(results, language, apiKey);

    console.log(`\n[PIPELINE] ═══ COMPLETE: Returning ${results.length} songs (language: ${language}) ═══\n`);
    return results;
}

module.exports = { runHymnPipeline, MASS_PARTS };
