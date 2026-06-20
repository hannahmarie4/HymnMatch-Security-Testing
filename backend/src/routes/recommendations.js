const express = require('express');
const router = express.Router();

// ── Startup Environment Validation ────────────────────────────────────────────
// Fail loudly at module-load time so the problem is obvious in server logs
// rather than silently returning a 500 on the first real request.
(function validateEnv() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error('╔══════════════════════════════════════════════════════════════╗');
        console.error('║  BACKEND CONFIG ERROR: GEMINI_API_KEY is missing from .env  ║');
        console.error('║  Add it to backend/.env and restart the server.             ║');
        console.error('╚══════════════════════════════════════════════════════════════╝');
    } else if (key.includes('your_') || key.includes('PASTE_')) {
        console.error('╔══════════════════════════════════════════════════════════════╗');
        console.error('║  BACKEND CONFIG ERROR: GEMINI_API_KEY looks like a         ║');
        console.error('║  placeholder — replace it with your real key in .env.      ║');
        console.error('╚══════════════════════════════════════════════════════════════╝');
    } else {
        console.log(`[recommendations] ✓ GEMINI_API_KEY loaded (starts: ${key.slice(0, 6)}…)`);
    }
})();

// ── Robust JSON Array Extractor ───────────────────────────────────────────────
// Handles: raw JSON array, ```json fences, object wrappers { "songs": [...] }
function extractJsonArray(raw) {
    let text = raw.replace(/^\uFEFF/, '').trim();

    // Strip ALL markdown code fences (```json, ```JSON, ```)
    text = text.replace(/^```[a-zA-Z]*\s*/m, '').replace(/```\s*$/m, '').trim();

    // Direct JSON array
    if (text.startsWith('[')) return JSON.parse(text);

    // Object wrapper — find the first array-valued key
    if (text.startsWith('{')) {
        const parsed = JSON.parse(text);
        const arrayKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
        if (arrayKey) return parsed[arrayKey];
        throw new Error('Response was a JSON object but contained no array property.');
    }

    // Last resort — regex scan for any JSON array in the response
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);

    throw new Error('Could not locate a JSON array in the model response.');
}

// ── POST /api/recommendations ─────────────────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const { text, season } = req.body;

        // ── Guard: payload ────────────────────────────────────────────────────
        if (!text || !text.trim()) {
            return res.status(400).json({
                error: 'No text payload provided. Please upload a readable document.',
                phase: 'payload_validation'
            });
        }

        // ── Guard: API key ────────────────────────────────────────────────────
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey.includes('your_') || apiKey.includes('PASTE_')) {
            console.error('CRITICAL BACKEND ERROR [Config]: GEMINI_API_KEY is missing or is a placeholder.');
            return res.status(500).json({
                error: 'Backend configuration error: GEMINI_API_KEY is missing or invalid. Check backend/.env and restart the server.',
                phase: 'env_validation'
            });
        }

        const prompt = `You are a Semantic NLP engine and Catholic Liturgical Music Director.

TASK:
Analyze the following liturgical document text. Based on the theological themes and the liturgical season "${season || 'Ordinary Time'}", recommend exactly 4 Catholic hymns — one for each Mass part.

MASS PARTS (use exactly these strings, case-sensitive):
- Entrance
- Offertory
- Communion
- Recessional

RULES:
- Only use officially approved Catholic hymns (OCP, GIA, WLP publishers — Breaking Bread, Gather, Journeysongs hymnals).
- Include the full lyrics for each hymn (all verses and chorus).
- Return ONLY a raw JSON array — no explanation, no markdown, no code fences.

REQUIRED OUTPUT (exactly 4 items):
[
  {
    "mass_part": "Entrance",
    "title": "Hymn Title",
    "composer": "Composer Name",
    "lyrics": "Full lyrics here..."
  },
  ...3 more items...
]

SOURCE TEXT:
"""
${text.slice(0, 5000)}
"""`;

        // ── Phase 1: Call Gemini REST API ─────────────────────────────────────
        let geminiData;
        try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            console.log('[recommendations] Phase 1 → Calling Gemini API...');

            const geminiRes = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 8192,
                        responseMimeType: 'application/json'
                    }
                })
            });

            if (!geminiRes.ok) {
                const errBody = await geminiRes.json().catch(() => ({}));
                const errMsg = errBody?.error?.message || `HTTP ${geminiRes.status}`;
                console.error(`CRITICAL BACKEND ERROR [Phase 1 — Gemini HTTP ${geminiRes.status}]:`, errMsg);
                return res.status(502).json({
                    error: `Gemini API returned an error: ${errMsg}`,
                    phase: 'gemini_api_call',
                    hint: 'Check that GEMINI_API_KEY is valid, has quota remaining, and the model name is correct.'
                });
            }

            geminiData = await geminiRes.json();
            console.log('[recommendations] Phase 1 ✓ Gemini API responded successfully.');
        } catch (e) {
            console.error('CRITICAL BACKEND ERROR [Phase 1 — Gemini API call]:', e.message);
            console.error(e.stack);
            return res.status(502).json({
                error: `Network error reaching Gemini API: ${e.message}`,
                phase: 'gemini_api_call',
                hint: 'Ensure the backend server has outbound internet access.'
            });
        }

        // ── Phase 2: Extract raw text from Gemini response ────────────────────
        let rawResponse;
        try {
            console.log('[recommendations] Phase 2 → Extracting text from Gemini response...');
            rawResponse = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            console.log('[recommendations] Phase 2 raw preview (500 chars):', rawResponse.slice(0, 500));

            if (!rawResponse) {
                const blockReason = geminiData?.promptFeedback?.blockReason;
                const msg = blockReason
                    ? `Gemini blocked the request: ${blockReason}`
                    : 'Gemini returned an empty response — the model may have timed out or the prompt was filtered.';
                console.error('CRITICAL BACKEND ERROR [Phase 2 — Response extraction]:', msg);
                console.error('Full Gemini data:', JSON.stringify(geminiData, null, 2));
                return res.status(502).json({
                    error: msg,
                    phase: 'gemini_response_extraction',
                    hint: 'Check the Gemini API dashboard for quota or billing issues.'
                });
            }
            console.log('[recommendations] Phase 2 ✓ Raw response extracted.');
        } catch (e) {
            console.error('CRITICAL BACKEND ERROR [Phase 2 — Response extraction]:', e.message);
            console.error(e.stack);
            return res.status(500).json({
                error: `Failed to read the Gemini response structure: ${e.message}`,
                phase: 'gemini_response_extraction'
            });
        }

        // ── Phase 3: Parse JSON from response ─────────────────────────────────
        let jsonResult;
        try {
            console.log('[recommendations] Phase 3 → Parsing JSON from response...');
            jsonResult = extractJsonArray(rawResponse);
            console.log('[recommendations] Phase 3 ✓ JSON parsed. Items:', jsonResult.length);
        } catch (e) {
            console.error('CRITICAL BACKEND ERROR [Phase 3 — JSON parsing]:', e.message);
            console.error('Raw response that failed to parse:\n', rawResponse);
            return res.status(500).json({
                error: `The AI returned a response that could not be parsed as JSON: ${e.message}`,
                phase: 'json_parsing',
                hint: 'The model may have ignored the JSON-only instruction. Try the request again.',
                rawPreview: rawResponse.slice(0, 300)
            });
        }

        // ── Phase 4: Validate & sanitise ─────────────────────────────────────
        let sanitised;
        try {
            console.log('[recommendations] Phase 4 → Validating and sanitising response...');

            if (!Array.isArray(jsonResult)) {
                throw new Error(`Expected a JSON array but received type: ${typeof jsonResult}`);
            }

            const PARTS = ['Entrance', 'Offertory', 'Communion', 'Recessional'];
            sanitised = jsonResult.map((item, i) => ({
                mass_part: typeof item.mass_part === 'string' ? item.mass_part : (PARTS[i] || 'Unknown'),
                title:     typeof item.title    === 'string' ? item.title    : 'Untitled Hymn',
                composer:  typeof item.composer === 'string' ? item.composer : 'Traditional',
                lyrics:    typeof item.lyrics   === 'string' ? item.lyrics   : 'Lyrics not available.',
            }));

            console.log('[recommendations] Phase 4 ✓ Sanitised. Returning', sanitised.length, 'hymns.');
        } catch (e) {
            console.error('CRITICAL BACKEND ERROR [Phase 4 — Sanitisation]:', e.message);
            console.error(e.stack);
            return res.status(500).json({
                error: `Response validation failed: ${e.message}`,
                phase: 'sanitisation'
            });
        }

        return res.status(200).json(sanitised);

    } catch (error) {
        // Outer safety net — catches anything that slipped through the phase guards
        console.error('CRITICAL BACKEND ERROR [Unhandled — outer catch]:', error.message);
        console.error(error.stack);
        return res.status(500).json({
            error: `An unexpected error occurred in the recommendation pipeline: ${error.message || 'Unknown error.'}`,
            phase: 'unhandled'
        });
    }
});

module.exports = router;
