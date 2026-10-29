import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { SortState } from "utils/TableSort";

interface SortableHeaderProps<TKey extends string> {
    label: string;
    sortKey: TKey;
    sort: SortState<TKey>;
    onSort: (key: TKey) => void;
    className?: string;
}

/**
 * Column header that sorts the table by its column when clicked, showing the current direction.
 */
export function SortableHeader<TKey extends string>({ label, sortKey, sort, onSort, className }: SortableHeaderProps<TKey>) {
    const isSorted = sort.key === sortKey;
    const icon = !isSorted ? "fas faSort" : sort.direction === "asc" ? "fas faSortUp" : "fas faSortDown";

    return (
        <th
            className={className}
            aria-sort={!isSorted ? "none" : sort.direction === "asc" ? "ascending" : "descending"}
        >
            <button
                type="button"
                className="inline-flex items-center gap-1 font-semibold hover:text-base-content mt-0"
                onClick={() => onSort(sortKey)}
            >
                {label}
                <FontAwesomeIcon icon={icon} classNames={isSorted ? [] : ["text-base-content/30"]} />
            </button>
        </th>);
}

interface TableFilterProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

/**
 * Text box that filters a table's rows as the user types.
 */
export function TableFilter({ value, onChange, placeholder, className }: TableFilterProps) {
    return (
        <label className={`input input-bordered input-sm flex items-center gap-2 mt-0 ${className ?? ""}`}>
            <FontAwesomeIcon icon="fas faMagnifyingGlass" classNames={["text-base-content/50"]} />
            <input
                type="search"
                className="grow mt-0"
                placeholder={placeholder ?? "Filter"}
                aria-label={placeholder ?? "Filter"}
                value={value}
                onChange={e => onChange(e.target.value)}
            />
        </label>);
}
