export function normalizePhoneMX(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Handle different formats — normalize to +52XXXXXXXXXX (no mobile "1" prefix, eliminated in 2019)
  if (digits.startsWith('521') && digits.length === 13) {
    // Strip obsolete mobile "1" prefix: 521XXXXXXXXXX → +52XXXXXXXXXX
    return '+52' + digits.slice(3);
  }
  if (digits.startsWith('52') && digits.length === 12) {
    return '+' + digits; // Already +52XXXXXXXXXX
  }
  if (digits.length === 10) {
    return '+52' + digits; // Add country code
  }

  return '+' + digits;
}

export function isValidMXPhone(phone: string): boolean {
  const normalized = normalizePhoneMX(phone);
  return /^\+52\d{10}$/.test(normalized);
}