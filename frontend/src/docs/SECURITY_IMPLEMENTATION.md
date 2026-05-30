// ============================================
// CONTROL #5: ENCRYPTED DATABASE
// ============================================
// Threat: Database File Theft / Physical Access
// CIA Principle: Confidentiality
// Status: IMPLEMENTED at Infrastructure Level
//
// Implementation Details:
// Provider: Supabase (built on AWS)
// Database: PostgreSQL with encryption at rest
// Encryption Algorithm: AES-256
// Transit Security: TLS 1.2+ (HTTPS only)
// Backups: Automated daily, encrypted
// Physical Security: AWS data centers (SOC 2 compliant)
// Access Control: IAM authentication, IP whitelisting
// Compliance: GDPR, SOC 2 Type II
//
// What We Do NOT Do:
// - Store database files locally
// - Transmit data over unencrypted connections
// - Store passwords in plain text
// - Log sensitive information in error messages
//
// Verification:
// - All Supabase connections use HTTPS (check browser DevTools)
// - Environment variables in .env are never exposed
// - Database credentials never appear in frontend code
