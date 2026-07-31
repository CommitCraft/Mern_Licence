/**
 * Utility for formatting and sanitizing user input for licence key:
 * Formats: EMS-PRO-XXXX-XXXX-XXXX-XXXX
 */
export function formatLicenceKey(input: string, prefix = 'EMS-PRO'): string {
  // Convert to uppercase and strip non-alphanumeric characters
  const clean = input.toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (clean.length === 0) {
    return '';
  }

  // If user starts typing full key without prefix, check if prefix is already typed
  let rawChars = clean;
  const cleanPrefix = prefix.replace(/[^A-Z0-9]/g, '');

  if (clean.startsWith(cleanPrefix)) {
    rawChars = clean.substring(cleanPrefix.length);
  }

  // Slice into 4-character chunks up to 16 characters
  const chunks: string[] = [];
  for (let i = 0; i < rawChars.length && i < 16; i += 4) {
    chunks.push(rawChars.substring(i, i + 4));
  }

  return `${prefix}-${chunks.join('-')}`;
}

export function isLicenceKeyComplete(key: string, prefix = 'EMS-PRO'): boolean {
  const clean = key.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanPrefix = prefix.replace(/[^A-Z0-9]/g, '');
  
  if (!clean.startsWith(cleanPrefix)) {
    return false;
  }
  
  // Prefix + 16 chars = 6 + 16 = 22 total alphanumeric chars
  return clean.length === (cleanPrefix.length + 16);
}
