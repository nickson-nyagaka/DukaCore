/**
 * Validates if a phone number is a valid Kenyan phone number.
 * Rules:
 * - Starts with +254, 254, 07, or 01
 * - The character length of the number (excluding the leading +) must not exceed 12 characters
 * - Standard formats:
 *   - +254 7XX XXX XXX or +254 1XX XXX XXX (13 chars with +)
 *   - 254 7XX XXX XXX or 254 1XX XXX XXX (12 chars)
 *   - 07XX XXX XXX or 01XX XXX XXX (10 chars)
 */
export function validateKenyanPhone(phone: string): boolean {
  // Strip whitespace, dashes, and parentheses
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  
  // Exclude leading plus for length verification
  const checkLengthStr = clean.startsWith('+') ? clean.slice(1) : clean;
  if (checkLengthStr.length > 12) {
    return false;
  }
  
  // Match prefix patterns
  // 1. Starts with +254 (followed by 9 digits, e.g. +254712345678 or +254112345678)
  if (clean.startsWith('+254')) {
    return /^\+254[17][0-9]{8}$/.test(clean);
  }
  
  // 2. Starts with 254 (followed by 9 digits, e.g. 254712345678)
  if (clean.startsWith('254')) {
    return /^254[17][0-9]{8}$/.test(clean);
  }
  
  // 3. Starts with 07 or 01 (followed by 8 digits, e.g. 0712345678 or 0112345678)
  if (clean.startsWith('07') || clean.startsWith('01')) {
    return /^(07|01)[0-9]{8}$/.test(clean);
  }
  
  return false;
}

/**
 * Validates if an email address is syntactically valid.
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}
