'use strict';
/**
 * index.js  —  HymnMatch Backend Server
 * ──────────────────────────────────────────────────────────────────────────────
 * All routes that require DB-backed hymn recommendations delegate to
 * the shared hymnPipeline module (src/lib/hymnPipeline.js), which
 * implements the 3-step hybrid retrieval pipeline:
 *
 *   STEP 1  Gemini NLP/Vision → language + theme extraction
 *   STEP 2  Supabase query → fetch real catholic_songs rows
 *   STEP 3  Gemini ranking → select best DB candidate per mass part
 */

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { runHymnPipeline }    = require('./lib/hymnPipeline');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

const PORT = process.env.PORT || 5000;

// ── Route modules ──────────────────────────────────────────────────────────────
const { loginLimiter }        = require('./middleware/rateLimiter');
const recommendationsRouter   = require('./routes/recommendations');
const readingsRouter          = require('./routes/readings');
const calendarRouter          = require('./routes/calendar');

app.use('/api/recommendations', recommendationsRouter);
app.use('/api/readings',        readingsRouter);
app.use('/api/calendar',        calendarRouter);

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.send('HymnMatch Backend is running.'));

// ── Auth (dummy / thesis demo) ─────────────────────────────────────────────────
app.post('/auth/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) throw new Error('Missing credentials');
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// ── POST /api/analyze-document ─────────────────────────────────────────────────
/**
 * Image-based (OCR) recommendation path.
 *
 * Request body:
 *   { imageBase64: string, mimeType?: string, season?: string }
 *
 * Flow:
 *   1. Gemini Vision reads the image → detects language + themes   (STEP 1)
 *   2. Supabase query → tiered retrieval from catholic_songs        (STEP 2)
 *   3. Gemini ranking → picks best DB candidate per mass part       (STEP 3)
 *
 * Response: flat array of 4 hymn objects:
 *   [{ mass_part, title, composer, lyrics }, ...]
 */
app.post('/api/analyze-document', async (req, res) => {
    const { imageBase64, mimeType, season } = req.body;

    if (!imageBase64) {
        return res.status(400).json({ error: 'No image provided.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY missing from backend .env.' });
    }

    try {
        console.log(`[analyze-document] Image received (mimeType: ${mimeType || 'image/jpeg'}), season: ${season || 'Ordinary Time'}`);

        // Strip data-URL header so we pass raw base64 to the pipeline
        const base64Data = imageBase64.includes(',')
            ? imageBase64.split(',')[1]
            : imageBase64;

        const hymns = await runHymnPipeline({
            base64: base64Data,
            mimeType: mimeType || 'image/jpeg',
            season:   season   || 'Ordinary Time',
            apiKey,
            mode: 'image'
        });

        return res.status(200).json(hymns);

    } catch (error) {
        console.error('[analyze-document] Error:', error.message, '\n', error.stack);
        res.status(500).json({ error: 'Failed to analyze document. Check backend logs.' });
    }
});

// ── POST /api/lyrics ───────────────────────────────────────────────────────────
/**
 * Fetch full lyrics for a specific hymn title via Gemini.
 * Request body: { title: string, composer?: string }
 */
app.post('/api/lyrics', async (req, res) => {
    const { title, composer } = req.body;
    if (!title) return res.status(400).json({ error: 'No song title provided.' });

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `Provide the public domain or common liturgical lyrics for the Catholic hymn "${title}" by ${composer || 'unknown'}. Return only the lyrics separated by standard paragraphs — no markdown, no chords, no song title header. If the exact lyrics are unknown, provide the closest known traditional lyrics or a brief summary of the hymn's liturgical use.`;

        const result = await model.generateContent(prompt);
        res.status(200).json({ lyrics: result.response.text() });
    } catch (error) {
        console.error('[lyrics] Error:', error);
        res.status(500).json({ error: 'Failed to fetch lyrics.' });
    }
});

// ── Start server ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n╔═══════════════════════════════════════════╗`);
    console.log(`║   HymnMatch Backend running on port ${PORT}  ║`);
    console.log(`╚═══════════════════════════════════════════╝\n`);
});
