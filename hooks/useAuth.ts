import { useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import {
  findUserByEmail,
  findUserWithHashByEmail,
  findUserById,
  insertUser,
  deleteUserById,
} from '@/db';
import {
  hashPassword,
  verifyPassword,
  setSession,
  getSession,
  clearSession,
} from '@/utils/auth';
import type { RegisterFormData, LoginFormData } from '@/types';

/**
 * Central hook for all auth operations.
 * Manages register, login, logout, delete account, and session restore.
 */
export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser } = useAuthContext();

  const register = useCallback(
    async (formData: RegisterFormData): Promise<string | null> => {
      const existing = await findUserByEmail(formData.email.toLowerCase().trim());
      if (existing) return 'An account with this email already exists.';

      const hash = await hashPassword(formData.password);
      await insertUser(formData.email.toLowerCase().trim(), hash);

      const newUser = await findUserByEmail(formData.email.toLowerCase().trim());
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
      setUser({ id: userRow.id, email: userRow.email, createdAt: userRow.createdAt });
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
    await deleteUserById(user.id);
    await clearSession();
    setUser(null);
  }, [user, setUser]);

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
    restoreSession,
  };
}
