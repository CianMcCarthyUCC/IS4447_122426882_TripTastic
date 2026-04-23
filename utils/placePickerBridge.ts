/**
 * A tiny hand-off used to send a picked place from the place-picker
 * modal back to the activity form. Simpler than round-tripping the
 * full place through navigation parameters.
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
