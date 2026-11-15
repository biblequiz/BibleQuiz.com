import stateData from "data/stateRegionsAndDistricts.json";

// US states are shown by their postal code, which everyone recognizes. Non-US areas (entries with a
// `country`) use made-up two-letter codes (the address State columns hold only two characters), so
// they are shown by name as well.
const NON_US_LABELS: Map<string, string> = new Map(
    (stateData as Array<{ code: string; label: string; country?: string }>)
        .filter(state => state.country)
        .map(state => [state.code, state.label]));

/**
 * Returns the text to show for a state code in a State dropdown: the code itself for a US state,
 * or "<name> (<code>)" for a non-US area such as "Bihar (BR)".
 */
export function formatStateOption(code: string): string {
    const label = NON_US_LABELS.get(code);
    return label ? `${label} (${code})` : code;
}
