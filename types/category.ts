export type Category = {
  id: number;
  name: string;
  color: string;
  icon: string;
  /** System categories (Unspecified) are locked from edits and deletion. */
  isSystem: boolean;
};

export type CategoryFormData = {
  name: string;
  color: string;
  icon: string;
};
