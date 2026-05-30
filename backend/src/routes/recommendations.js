const express = require('express');
const router = express.Router();

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

        if (!text || !text.trim()) {
            return res.status(400).json({
                error: 'No text payload provided. Please upload a readable document.'
            });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey.includes('your_') || apiKey.includes('PASTE_')) {
            return res.status(500).json({
                error: 'GEMINI_API_KEY is not configured correctly in backend/.env'
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

        // ── Call Gemini REST API directly via fetch ────────────────────────────
        // Using the REST endpoint avoids SDK version compatibility issues
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const geminiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 8192,
                    responseMimeType: 'application/json'   // Force JSON output
                }
            })
        });

        if (!geminiRes.ok) {
            const errBody = await geminiRes.json().catch(() => ({}));
            const errMsg = errBody?.error?.message || `HTTP ${geminiRes.status}`;
            console.error('[recommendations] Gemini API error:', errMsg);
            return res.status(502).json({
                error: `Gemini API error: ${errMsg}`
            });
        }

        const geminiData = await geminiRes.json();
        const rawResponse = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        console.log('[recommendations] Raw Gemini response (first 500 chars):', rawResponse.slice(0, 500));

        if (!rawResponse) {
            const blockReason = geminiData?.promptFeedback?.blockReason;
            return res.status(502).json({
                error: blockReason
                    ? `Gemini blocked the request: ${blockReason}`
                    : 'Gemini returned an empty response. Please try again.'
            });
        }

        // ── Parse & validate ──────────────────────────────────────────────────
        let jsonResult;
        try {
            jsonResult = extractJsonArray(rawResponse);
        } catch (parseError) {
            console.error('[recommendations] JSON parse failed. Raw:\n', rawResponse);
            return res.status(500).json({
                error: 'The AI returned an unparseable response. Please try again.'
            });
        }

        if (!Array.isArray(jsonResult)) {
            return res.status(500).json({ error: 'AI response was not a JSON array.' });
        }

        // Sanitise — ensure all required keys exist with safe string fallbacks
        const PARTS = ['Entrance', 'Offertory', 'Communion', 'Recessional'];
        const sanitised = jsonResult.map((item, i) => ({
            mass_part: typeof item.mass_part === 'string' ? item.mass_part : (PARTS[i] || 'Unknown'),
            title:     typeof item.title    === 'string' ? item.title    : 'Untitled Hymn',
            composer:  typeof item.composer === 'string' ? item.composer : 'Traditional',
            lyrics:    typeof item.lyrics   === 'string' ? item.lyrics   : 'Lyrics not available.',
        }));

        return res.status(200).json(sanitised);

    } catch (error) {
        console.error('[recommendations] Unhandled error:', error);
        return res.status(500).json({
            error: 'Failed to generate recommendations. ' + (error.message || 'Unknown error.')
        });
    }
});

module.exports = router;
