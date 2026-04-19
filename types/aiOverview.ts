/**
 * Cached AI-generated trip overview. One per trip — regenerating overwrites
 * the previous row. Persisted via the `trip_ai_overviews` Drizzle table so
 * users don't burn API quota re-opening the Summary tab.
 */
export type TripAiOverview = {
  tripId: number;
  /** Multi-paragraph trip summary from the model. Plain prose, no markdown. */
  content: string;
  /**
   * Activity IDs in the model's recommended order. Stored as JSON in SQLite;
   * the repository parses / serialises at the boundary so the rest of the
   * app only ever deals with a `number[]`.
   */
  recommendedOrder: number[];
  /** Model identifier the content was generated with (e.g. `gemini-flash-latest`). */
  model: string;
  /** ISO timestamp — used to show "Generated <n> minutes ago" in the UI. */
  generatedAt: string;
};

/** Payload used by `upsertAiOverview` — identical to the row shape minus PK. */
export type TripAiOverviewInput = Omit<TripAiOverview, 'generatedAt'> & {
  generatedAt?: string;
};
