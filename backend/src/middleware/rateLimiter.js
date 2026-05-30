const rateLimit = require('express-rate-limit');

// ============================================
// SECURITY CONTROL #4: Custom Rate Limiter
// Hardened against brute-force attacks
// Fixed: ERR_RL_KEY_GEN_IPV6 on local dev
// ============================================

/**
 * Safe IP extractor — resolves the real client IP across:
 *   - IPv4 direct connections  (e.g. 127.0.0.1)
 *   - IPv4-mapped IPv6          (e.g. ::ffff:127.0.0.1 → stripped to 127.0.0.1)
 *   - Pure IPv6                 (e.g. ::1)
 *   - Proxied requests          (X-Forwarded-For header)
 *   - Undefined / empty         (fallback to 'unknown')
 */
function getClientIp(req) {
    // 1. Try X-Forwarded-For (set by proxies/load balancers)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const first = forwarded.split(',')[0].trim();
        if (first) return first;
    }

    // 2. Try req.ip (Express sets this from socket.remoteAddress)
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;

    if (!ip) return 'unknown';

    // 3. Strip IPv4-mapped IPv6 prefix (::ffff:x.x.x.x → x.x.x.x)
    if (ip.startsWith('::ffff:')) return ip.substring(7);

    return ip;
}

// In local development, use a relaxed limiter so IPv6 issues
// don't crash the server during testing.
const isDev = process.env.NODE_ENV !== 'production';

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15-minute window
    max: isDev ? 100 : 5,       // Relaxed in dev, strict in production
    message: {
        error: 'Too many login attempts. Please try again in 15 minutes.'
    },
    standardHeaders: true,      // Return RateLimit-* headers (RFC 6585)
    legacyHeaders: false,       // Disable deprecated X-RateLimit-* headers
    skipFailedRequests: false,
    skipSuccessfulRequests: false,

    // ── FIX: Safe keyGenerator with IPv6 fallback ─────────────────────────
    keyGenerator: (req) => {
        const ip = getClientIp(req);
        // Ensure we never return undefined/null/empty — rate-limit requires a string
        return ip || 'unknown-client';
    },

    // Custom handler — returns JSON instead of plain text
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many login attempts. Please try again later.',
            retryAfter: Math.ceil(15 * 60) // seconds
        });
    }
});

// General API rate limiter (for /api/* routes like /api/recommendations)
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,        // 1-minute window
    max: isDev ? 200 : 30,      // 30 req/min in production, relaxed in dev
    message: { error: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => getClientIp(req) || 'unknown-client',
    handler: (req, res) => {
        res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment.' });
    }
});

module.exports = { loginLimiter, apiLimiter };
