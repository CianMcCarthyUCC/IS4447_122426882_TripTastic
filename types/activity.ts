export type ActivityStatus = 'planned' | 'completed';

export type Activity = {
  id: number;
  tripId: number;
  categoryId: number;
  date: string;
  metric: number;
  status: ActivityStatus;
  notes: string | null;
};

export type ActivityFormData = {
  tripId: number;
  categoryId: number;
  date: string;
  metric: string;
  status: ActivityStatus;
  notes: string;
};
