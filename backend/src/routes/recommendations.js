'use strict';
/**
 * recommendations.js  —  POST /api/recommendations
 * ──────────────────────────────────────────────────────────────────────────────
 * Entry point for the text-based (PDF / typed-text) recommendation path.
 * All heavy lifting is delegated to hymnPipeline.js.
 *
 * Request body:
 *   { text: string, season?: string }
 *
 * Response:
 *   Array of 4 hymn objects from the catholic_songs Supabase table:
 *   [{ mass_part, title, composer, lyrics }, ...]
 */

const express = require('express');
const router  = express.Router();
const { runHymnPipeline } = require('../lib/hymnPipeline');

// ── Startup Validation ─────────────────────────────────────────────────────────
(function validateEnv() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error('[recommendations] ✗ GEMINI_API_KEY missing from .env — pipeline will degrade to fallback detection');
    } else {
        console.log(`[recommendations] ✓ GEMINI_API_KEY loaded (${key.slice(0, 6)}…)`);
    }
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.error('[recommendations] ✗ SUPABASE_URL or SUPABASE_ANON_KEY missing — DB queries will fail');
    } else {
        console.log('[recommendations] ✓ Supabase credentials present');
    }
})();

// ── POST /api/recommendations ─────────────────────────────────────────────────
router.post('/', async (req, res) => {
    const { text, season } = req.body;

    // Guard: text payload
    if (!text || !text.trim()) {
        return res.status(400).json({
            error: 'No text payload provided. Please upload a readable document.',
            phase: 'payload_validation'
        });
    }

    // Guard: Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('your_') || apiKey.includes('PASTE_')) {
        return res.status(500).json({
            error: 'Backend configuration error: GEMINI_API_KEY is missing or invalid.',
            phase: 'env_validation'
        });
    }

    try {
        console.log(`[recommendations] Incoming text (${text.length} chars), season: ${season || 'Ordinary Time'}`);

        const hymns = await runHymnPipeline({
            text,
            season: season || 'Ordinary Time',
            apiKey,
            mode: 'text'
        });

        return res.status(200).json(hymns);

    } catch (err) {
        console.error('[recommendations] Pipeline error:', err.message, '\n', err.stack);
        return res.status(500).json({
            error: `An unexpected error occurred in the recommendation pipeline: ${err.message}`,
            phase: 'unhandled'
        });
    }
});

module.exports = router;
