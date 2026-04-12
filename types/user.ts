export type User = {
  id: number;
  email: string;
  createdAt: string;
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
