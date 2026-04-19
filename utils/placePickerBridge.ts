/**
 * Tiny module-scoped bridge for passing a picked Place from the
 * place-picker modal back to the presenting screen (Activity add).
 *
 * Expo Router params are string-only, so serialising a full Place object
 * via params is noisy. Using a module-level ref keeps the flow one-way and
 * simple: picker `set()`s → navigates back → presenter `consume()`s on focus.
 */
import type { Place } from './geoapify';

let pending: Place | null = null;

export function setPickedPlace(place: Place): void {
  pending = place;
}

export function consumePickedPlace(): Place | null {
  const p = pending;
  pending = null;
  return p;
}
