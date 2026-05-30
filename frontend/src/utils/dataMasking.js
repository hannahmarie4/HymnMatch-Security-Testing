// ============================================
// SECURITY FIX: Email Data Masking
// Issue #4: Hide full email addresses in display
// ============================================

export const maskEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return 'invalid email';
  }

  const [local, domain] = email.split('@');

  if (!local || !domain) {
    return 'invalid email';
  }

  // If email local part is 3 characters or less, mask all but first char
  if (local.length <= 3) {
    return local.charAt(0) + '*'.repeat(local.length - 1) + '@' + domain;
  }

  // Otherwise, show first 2 characters, mask the rest
  const visible = local.substring(0, 2);
  const masked = '*'.repeat(local.length - 2);
  return visible + masked + '@' + domain;
};
