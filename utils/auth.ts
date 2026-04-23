import * as Crypto from 'expo-crypto';
import { getActiveSession, createSession, clearSessionDb } from '@/db';

// Password hash format: `v2$<saltHex>$<hashHex>`. The `v2` prefix lets
// `verifyPassword` tell a new hash from a legacy unsalted SHA-256 hex so
// accounts created before the salting change can still log in.
const HASH_VERSION = 'v2';
const SALT_BYTES = 16;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256Hex(input: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
}

/**
 * Hashes a password together with a random per-user salt before saving
 * it to the database, so that two users with the same password never
 * end up with the same stored hash.
 */
export async function hashPassword(password: string): Promise<string> {
  const saltBytes = await Crypto.getRandomBytesAsync(SALT_BYTES);
  const saltHex = toHex(saltBytes);
  const hashHex = await sha256Hex(saltHex + password);
  return `${HASH_VERSION}$${saltHex}$${hashHex}`;
}

/**
 * Verifies a password against a stored hash. Supports both the new v2
 * salted format and the legacy unsalted-SHA-256 hex format so existing
 * users keep logging in seamlessly after the salting upgrade.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith(`${HASH_VERSION}$`)) {
    const parts = storedHash.split('$');
    // `['v2', saltHex, hashHex]` - anything else is malformed.
    if (parts.length !== 3) return false;
    const [, saltHex, expectedHex] = parts;
    if (!saltHex || !expectedHex) return false;
    const actualHex = await sha256Hex(saltHex + password);
    return actualHex === expectedHex;
  }
  // Legacy path: bare SHA-256 hex. Kept so accounts predating the
  // salting change still work. New registrations never write this format.
  const legacyHex = await sha256Hex(password);
  return legacyHex === storedHash;
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
