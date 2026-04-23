export type ActivityStatus = 'planned' | 'completed';

export type Activity = {
  id: number;
  tripId: number;
  categoryId: number;
  date: string;
  metric: number;
  status: ActivityStatus;
  place: string | null;
  notes: string | null;
  /**
   * Per-activity favourite marker. Any number can be set per trip - sort
   * order uses `favouritedAt` so starred items appear at the top of the
   * list in the order they were favourited.
   */
  isFavourite: boolean;
  /**
   * ISO timestamp captured when the activity was last starred; null when
   * never starred or after an unstar.
   */
  favouritedAt: string | null;
};

export type ActivityFormData = {
  tripId: number;
  categoryId: number;
  date: string;
  metric: string;
  status: ActivityStatus;
  place: string;
  notes: string;
};
