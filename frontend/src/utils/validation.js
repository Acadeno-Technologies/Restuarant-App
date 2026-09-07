/**
 * Validation utilities for forms across T-Clock
 */

const COMMON_TLD_TYPOS = ['ocm', 'cmo', 'con', 'comm', 'coom', 'vom', 'xom', 'cpm', 'ckm'];

const COMMON_DOMAIN_TYPOS = {
  'gm.com': 'gmail.com',
  'gm.ocm': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmail.ocm': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.cmo': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahoo.ocm': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
};

/**
 * Validates email address format, domain spelling, and common typos.
 * Returns { isValid: boolean, error?: string }
 */
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return { isValid: true };
  }

  const cleanEmail = email.trim().toLowerCase();

  // Basic regex check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. name@gmail.com)' };
  }

  const parts = cleanEmail.split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Please enter a valid email address format.' };
  }

  const domain = parts[1];
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];

  // Check for common typo TLDs like .ocm, .con
  if (COMMON_TLD_TYPOS.includes(tld)) {
    return { isValid: false, error: `Invalid domain ending ".${tld}". Did you mean ".com"?` };
  }

  // Check for common domain typos like gm.ocm, gmai.com
  if (COMMON_DOMAIN_TYPOS[domain]) {
    return { 
      isValid: false, 
      error: `Invalid email domain "${domain}". Did you mean "${COMMON_DOMAIN_TYPOS[domain]}"?` 
    };
  }

  return { isValid: true };
};

/**
 * Validates phone numbers (10 digits).
 * Returns { isValid: boolean, error?: string }
 */
export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) {
    return { isValid: true };
  }

  const cleanPhone = phone.trim().replace(/\D/g, '');
  if (cleanPhone.length !== 10) {
    return { isValid: false, error: 'Phone number must be exactly 10 digits' };
  }

  return { isValid: true, cleanPhone };
};
