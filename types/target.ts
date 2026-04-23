export type TargetPeriod = 'weekly' | 'monthly';

export type Target = {
  id: number;
  tripId: number | null;
  categoryId: number;
  targetValue: number;
  period: TargetPeriod;
  notes: string | null;
  isFavourite: boolean;
};

export type TargetFormData = {
  tripId: number | null;
  categoryId: number;
  targetValue: string;
  period: TargetPeriod;
  notes: string;
};
