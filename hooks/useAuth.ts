import { useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import {
  findUserByEmail,
  findUserWithHashByEmail,
  findUserById,
  insertUser,
  deleteUserById,
  updateUserProfile,
} from '@/db';
import {
  hashPassword,
  verifyPassword,
  setSession,
  getSession,
  clearSession,
} from '@/utils/auth';
import { deleteAvatar } from '@/utils/avatarStorage';
import type { RegisterFormData, LoginFormData, UpdateProfileInput } from '@/types';

/**
 * The central hook for user accounts. Covers register, log in, log out,
 * profile updates, deleting the account and restoring the session on
 * app start.
 */
export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser } = useAuthContext();

  const register = useCallback(
    async (formData: RegisterFormData): Promise<string | null> => {
      const email = formData.email.toLowerCase().trim();
      const existing = await findUserByEmail(email);
      if (existing) return 'An account with this email already exists.';

      const hash = await hashPassword(formData.password);
      try {
        await insertUser(email, hash);
      } catch (e) {
        // The pre-check above handles the common duplicate case, but a race
        // (two rapid submits) or any other constraint/IO failure still needs
        // to surface something user-friendly instead of a raw SQLite error.
        const message = e instanceof Error ? e.message : '';
        if (message.toLowerCase().includes('unique')) {
          return 'An account with this email already exists.';
        }
        return 'Registration failed. Please try again.';
      }

      const newUser = await findUserByEmail(email);
      if (!newUser) return 'Registration failed. Please try again.';

      await setSession(newUser.id);
      setUser(newUser);
      return null;
    },
    [setUser],
  );

  const login = useCallback(
    async (formData: LoginFormData): Promise<string | null> => {
      const userRow = await findUserWithHashByEmail(formData.email.toLowerCase().trim());
      if (!userRow) return 'No account found with this email.';

      const valid = await verifyPassword(formData.password, userRow.passwordHash);
      if (!valid) return 'Incorrect password.';

      await setSession(userRow.id);
      setUser({
        id: userRow.id,
        email: userRow.email,
        createdAt: userRow.createdAt,
        displayName: userRow.displayName,
        homeCity: userRow.homeCity,
        profilePicture: userRow.profilePicture,
      });
      return null;
    },
    [setUser],
  );

  const logout = useCallback(async () => {
    await clearSession();
    setUser(null);
  }, [setUser]);

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    // Remove the avatar file before the row itself so we don't leave an
    // orphan jpg in `documentDirectory/avatars/`. `deleteAvatar` swallows
    // its own errors, so it won't block the account deletion if the file
    // was already gone.
    if (user.profilePicture) {
      await deleteAvatar(user.profilePicture);
    }
    await deleteUserById(user.id);
    await clearSession();
    setUser(null);
  }, [user, setUser]);

  // Persists profile edits via Drizzle then mirrors the freshly-read row back
  // into context so every consumer (Account hero, drawer, etc.) re-renders
  // with the new values without a full session-restore round-trip.
  const updateProfile = useCallback(
    async (data: UpdateProfileInput): Promise<string | null> => {
      if (!user) return 'You must be signed in to update your profile.';
      const trimmed: UpdateProfileInput = {
        displayName: data.displayName.trim(),
        homeCity: data.homeCity.trim(),
        // URI is passed through verbatim - trimming a `file://` path would
        // corrupt it, and the caller already resolved it via `saveAvatar`.
        profilePicture: data.profilePicture,
      };
      const updated = await updateUserProfile(user.id, trimmed);
      if (!updated) return 'Could not save profile. Please try again.';
      setUser(updated);
      return null;
    },
    [user, setUser],
  );

  const restoreSession = useCallback(async () => {
    const userId = await getSession();
    if (userId) {
      const restored = await findUserById(userId);
      if (restored) {
        setUser(restored);
        return;
      }
    }
    setUser(null);
  }, [setUser]);

  return {
    user,
    isAuthenticated,
    isLoading,
    register,
    login,
    logout,
    deleteAccount,
    updateProfile,
    restoreSession,
  };
}
