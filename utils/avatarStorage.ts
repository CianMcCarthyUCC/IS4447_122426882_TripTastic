import { Directory, File, Paths } from 'expo-file-system';

/**
 * Helpers for saving and deleting profile-picture files. Copies images
 * the user picks into a dedicated folder the system won't clear, so the
 * avatar sticks around between app launches.
 */
const AVATARS_SUBDIR = 'avatars';

function avatarsDir(): Directory {
  return new Directory(Paths.document, AVATARS_SUBDIR);
}

/** `true` if `uri` points at our managed avatar directory. Used by the
 *  edit flow to decide whether a fresh copy is needed (a URI that's
 *  already under `documentDirectory/avatars/` is the user keeping the
 *  existing photo). */
export function isManagedAvatarUri(uri: string): boolean {
  if (!uri) return false;
  return uri.includes(`/${AVATARS_SUBDIR}/`);
}

/**
 * Copies `sourceUri` (usually a cache URI from `expo-image-picker`) into
 * `documentDirectory/avatars/user-<userId>-<timestamp>.jpg` and returns
 * the new stable `file://` URI. Creates the avatars directory on first
 * use. Callers should persist the returned URI to SQLite.
 */
export async function saveAvatar(userId: number, sourceUri: string): Promise<string> {
  const dir = avatarsDir();
  if (!dir.exists) {
    // `intermediates` ensures any missing parents are created; `idempotent`
    // keeps repeated calls quiet once it exists.
    dir.create({ intermediates: true, idempotent: true });
  }
  // Timestamp in the filename means a new save never collides with the
  // previous file, so we can reliably delete the old one after writing.
  const dest = new File(dir, `user-${userId}-${Date.now()}.jpg`);
  const source = new File(sourceUri);
  source.copy(dest);
  return dest.uri;
}

/**
 * Best-effort delete for a previously-saved avatar file. Swallows errors
 * because the file may have already been removed (e.g. by a manual cache
 * clear) and the caller has nothing useful to do with the failure.
 */
export async function deleteAvatar(uri: string): Promise<void> {
  if (!uri || !isManagedAvatarUri(uri)) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    /* ignore - file already gone or unreadable */
  }
}
