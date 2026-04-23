/**
 * Shared helpers for building accessibility labels used across the app.
 * Keeps the phrasing consistent (screen readers hear the same pattern
 * on every button), and means every new screen picks up the same tone
 * without re-inventing the wording each time.
 *
 * Convention: functions return a single short sentence, with an initial
 * capital and no trailing punctuation. Screen readers add their own
 * pause at the end of the string.
 */

/**
 * "Mark / Unmark" favourite toggle label, used wherever the user can
 * star or un-star an entity (activity, goal, etc).
 */
export function favouriteToggleLabel(entity: string, isFavourite: boolean): string {
  return isFavourite ? `Unmark ${entity} as favourite` : `Mark ${entity} as favourite`;
}

/**
 * Status toggle label for completed / planned activities, used on the
 * tappable status chip.
 */
export function completeToggleLabel(isCompleted: boolean): string {
  return isCompleted ? 'Mark activity as planned' : 'Mark activity as completed';
}

/**
 * Generic "Edit <entity>" label for inline edit buttons.
 */
export function editLabel(entity: string): string {
  return `Edit ${entity}`;
}

/**
 * "View <entity> details" label used by the DetailsLink across every
 * list card.
 */
export function viewDetailsLabel(entity: string): string {
  return `View ${entity} details`;
}

/**
 * "Delete <entity>" label used on delete buttons and confirm dialogs.
 */
export function deleteLabel(entity: string): string {
  return `Delete ${entity}`;
}

/**
 * Label builder for saved-filter chips: "Apply <name> filter" /
 * "Remove <name> filter". Centralised so both the apply target and
 * the tiny X button read consistently.
 */
export function savedFilterLabels(filterName: string): {
  apply: string;
  remove: string;
} {
  return {
    apply: `Apply ${filterName} filter`,
    remove: `Remove ${filterName} filter`,
  };
}

/**
 * Label for the Filters pill that opens the drill-down sheet. Includes
 * the active filter count so the user hears how many filters are on.
 */
export function filtersPillLabel(activeCount: number): string {
  return activeCount > 0 ? `Filters, ${activeCount} active` : 'Filters';
}

/**
 * Label for a sort-direction toggle. Reads natural when the chip flips
 * ("Sort by name A to Z, tap to flip").
 */
export function sortToggleLabel(by: string, direction: 'asc' | 'desc'): string {
  const order = direction === 'asc' ? 'A to Z' : 'Z to A';
  return `Sort by ${by} ${order}, tap to flip`;
}

/**
 * "Suggestion" chip label, used for the inline filter suggestions that
 * appear above a list.
 */
export function suggestionLabel(suggestion: string): string {
  return `Try filter: ${suggestion}`;
}

/**
 * Label for backdrop / dismiss overlays, spoken the same way on every
 * modal so the user always knows how to get out.
 */
export function dismissOverlayLabel(of: string = 'menu'): string {
  return `Close ${of}`;
}
