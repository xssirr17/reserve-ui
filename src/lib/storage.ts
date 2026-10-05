import { STORAGE_USER_ID_KEY } from './constants';

/**
 * Safely retrieves the stored userId from localStorage.
 * Handles disabled cookies/storage, SSR, or quota exceptions gracefully.
 */
export function getStoredUserId(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(STORAGE_USER_ID_KEY) || '';
    }
  } catch (err) {
    console.warn('Unable to read userId from localStorage:', err);
  }
  return '';
}

/**
 * Safely persists the entered userId to localStorage.
 */
export function setStoredUserId(userId: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (userId.trim()) {
        window.localStorage.setItem(STORAGE_USER_ID_KEY, userId.trim());
      } else {
        window.localStorage.removeItem(STORAGE_USER_ID_KEY);
      }
    }
  } catch (err) {
    console.warn('Unable to write userId to localStorage:', err);
  }
}
