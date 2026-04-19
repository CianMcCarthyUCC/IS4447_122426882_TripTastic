export type User = {
  id: number;
  email: string;
  createdAt: string;
  /** Display name shown on the Account screen. Empty string until the user
   *  fills it in on Edit Profile — the profile screen falls back to the
   *  email-local-part in that case. */
  displayName: string;
  /** Optional home city shown under the user's name. Empty string when unset. */
  homeCity: string;
  /** Local file URI (`file://...`) of the avatar image. Empty string when
   *  the user hasn't set one — the UI falls back to initials. */
  profilePicture: string;
};

export type UpdateProfileInput = {
  displayName: string;
  homeCity: string;
  profilePicture: string;
};

export type RegisterFormData = {
  email: string;
  password: string;
  confirmPassword: string;
};

export type LoginFormData = {
  email: string;
  password: string;
};
