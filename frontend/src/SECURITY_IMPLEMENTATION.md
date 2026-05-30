## Database Security Architecture

**Provider:** Supabase (AWS-backed PostgreSQL)

**Encryption:**
- At Rest: AES-256 encryption
- In Transit: TLS 1.2+ (HTTPS)
- Backups: Encrypted daily backups

**Access Control:**
- Row Level Security (RLS) enforced at database level
- IAM authentication on Supabase project
- Users can only access their own data

**Physical Security:**
- AWS data centers with 24/7 monitoring
- SOC 2 and GDPR compliance
- Geographically distributed for disaster recovery
