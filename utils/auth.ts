import * as Crypto from 'expo-crypto';
import { getActiveSession, createSession, clearSessionDb } from '@/db';

/**
 * Hashes a password using SHA256 via expo-crypto.
 */
export async function hashPassword(password: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
}

/**
 * Verifies a password against a stored hash.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const hash = await hashPassword(password);
  return hash === storedHash;
}

/**
 * Persists the logged-in user ID to the sessions table (SQLite via Drizzle).
 */
export async function setSession(userId: number): Promise<void> {
  await createSession(userId);
}

/**
 * Reads the persisted user ID from the sessions table.
 * Returns null if no session exists.
 */
export async function getSession(): Promise<number | null> {
  return getActiveSession();
}

/**
 * Clears the persisted session from the sessions table.
 */
export async function clearSession(): Promise<void> {
  await clearSessionDb();
}
