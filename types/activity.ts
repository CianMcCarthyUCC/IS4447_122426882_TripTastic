export type Activity = {
  id: number;
  tripId: number;
  categoryId: number;
  date: string;
  metric: number;
  notes: string | null;
};

export type ActivityFormData = {
  tripId: number;
  categoryId: number;
  date: string;
  metric: string;
  notes: string;
};
