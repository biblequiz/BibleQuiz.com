/**
 * Direction a table column is sorted in.
 */
export type SortDirection = "asc" | "desc";

/**
 * Column a table is sorted by, and in which direction.
 */
export interface SortState<TKey extends string> {
    key: TKey;
    direction: SortDirection;
}

/**
 * Compares two cell values as text, ignoring case and comparing runs of digits as numbers, so "EZScore 2026.10.27.1"
 * sorts after "EZScore 2026.9.30.1".
 */
export function compareText(a: string | null | undefined, b: string | null | undefined): number {
    return (a ?? "").localeCompare(b ?? "", undefined, { numeric: true, sensitivity: "base" });
}

/**
 * Gets the sort after clicking a column's header: the same column flips its direction, and another column starts in its
 * default direction.
 */
export function getNextSort<TKey extends string>(
    current: SortState<TKey>,
    key: TKey,
    defaultDirection: SortDirection = "asc"): SortState<TKey> {

    if (current.key === key) {
        return { key, direction: current.direction === "asc" ? "desc" : "asc" };
    }

    return { key, direction: defaultDirection };
}

/**
 * Sorts a copy of rows by the column in sort. Rows the column ranks equal keep their order, so callers can pass rows
 * already in a sensible default order.
 */
export function sortRows<TRow, TKey extends string>(
    rows: TRow[],
    sort: SortState<TKey>,
    comparers: Record<TKey, (a: TRow, b: TRow) => number>): TRow[] {

    const compare = comparers[sort.key];
    const sign = sort.direction === "asc" ? 1 : -1;
    return rows
        .map((row, index) => ({ row, index }))
        .sort((a, b) => sign * compare(a.row, b.row) || a.index - b.index)
        .map(entry => entry.row);
}

/**
 * Determines whether a row matches the text typed in a table's filter box: every word typed must appear, ignoring case,
 * in at least one of the row's values. An empty filter matches every row.
 */
export function matchesFilter(filter: string, values: (string | null | undefined)[]): boolean {
    const terms = filter.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    if (terms.length === 0) {
        return true;
    }

    const text = values.filter(v => !!v).map(v => v!.toLowerCase());
    return terms.every(term => text.some(value => value.includes(term)));
}
