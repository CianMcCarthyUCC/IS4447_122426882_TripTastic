export type ActivityStatus = 'planned' | 'completed';

export type Activity = {
  id: number;
  tripId: number;
  categoryId: number;
  date: string;
  metric: number;
  status: ActivityStatus;
  notes: string | null;
  /**
   * "Number-one priority" marker — at most one activity per trip carries
   * this flag. Drives the Priority pin in the activities list and the
   * Highlights card on the past-trip screen.
   */
  isFavourite: boolean;
};

export type ActivityFormData = {
  tripId: number;
  categoryId: number;
  date: string;
  metric: string;
  status: ActivityStatus;
  notes: string;
};
