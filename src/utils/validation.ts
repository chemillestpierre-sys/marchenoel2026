import type { SavedParentProfile } from '../types';

const STORAGE_KEY = 'marche_noel_st_pierre_parent_v1';

export function cleanName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, 40);
}

export function normalizeLastName(value: string): string {
  return cleanName(value).toUpperCase();
}

export function normalizeFirstName(value: string): string {
  const cleaned = cleanName(value);
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Valide un numéro de téléphone français :
 * - 10 chiffres commençant par 0 (ex : 06 12 34 56 78, 0241000000, 06.12.34.56.78)
 * - ou format international +33 suivi de 9 chiffres (ex : +33 6 12 34 56 78)
 */
export function isValidFrenchPhone(phone: string): boolean {
  const compact = phone.replace(/[\s.\-()]/g, '');
  if (/^0[1-9]\d{8}$/.test(compact)) return true;
  if (/^\+33[1-9]\d{8}$/.test(compact)) return true;
  if (/^0033[1-9]\d{8}$/.test(compact)) return true;
  return false;
}

export function formatFrenchPhone(phone: string): string {
  const compact = phone.replace(/[\s.\-()]/g, '');
  if (/^0[1-9]\d{8}$/.test(compact)) {
    return compact.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  }
  return phone.trim();
}

export function isValidOptionalEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function loadSavedParentProfile(): SavedParentProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedParentProfile>;
    if (
      typeof parsed.prenom === 'string' &&
      typeof parsed.nom === 'string' &&
      typeof parsed.telephone === 'string'
    ) {
      return {
        prenom: parsed.prenom,
        nom: parsed.nom,
        telephone: parsed.telephone,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveParentProfile(profile: SavedParentProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage quota or private browsing errors
  }
}
