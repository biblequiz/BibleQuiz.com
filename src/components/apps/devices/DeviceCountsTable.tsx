import { useMemo, useState } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { SortableHeader, TableFilter } from "./TableControls";
import { compareText, getNextSort, matchesFilter, sortRows, type SortState } from "utils/TableSort";

interface Props {
    title: string;
    icon: string;
    counts: Record<string, number>;
    total: number;

    /** Value currently filtered on (highlighted), if any. */
    selected?: string | null;

    /** Called with a value when it's clicked, or null to clear the filter. Without it, the rows can't be clicked. */
    onSelect?: (value: string | null) => void;
}

type CountSortKey = "label" | "count";

const DEFAULT_SORT: SortState<CountSortKey> = { key: "count", direction: "desc" };

/**
 * Table of device counts with a bar showing each count's share of the total, largest first. The rows can be sorted by
 * value or count and filtered by typing.
 */
export default function DeviceCountsTable({ title, icon, counts, total, selected, onSelect }: Props) {
    const [sort, setSort] = useState<SortState<CountSortKey>>(DEFAULT_SORT);
    const [filter, setFilter] = useState("");

    const allRows = useMemo(
        () => Object.entries(counts).sort((a, b) => b[1] - a[1] || compareText(a[0], b[0])),
        [counts]);
    const rows = useMemo(
        () => sortRows(
            // The selected value stays in view, so the table always shows what the page is filtered on.
            allRows.filter(([label]) => label === selected || matchesFilter(filter, [label])),
            sort,
            {
                label: (a, b) => compareText(a[0], b[0]),
                count: (a, b) => a[1] - b[1],
            }),
        [allRows, filter, sort, selected]);

    const onSort = (key: CountSortKey) => setSort(current => getNextSort(current, key, key === "count" ? "desc" : "asc"));

    return (
        <div className="card bg-base-200 mt-0 mb-0">
            <div className="card-body p-3 gap-2">
                <h4 className="font-semibold text-sm mt-0 mb-0 flex items-center gap-2">
                    <FontAwesomeIcon icon={icon} classNames={["text-base-content/60"]} />
                    {title}
                    {onSelect && selected && (
                        <button type="button" className="btn btn-ghost btn-xs ml-auto mt-0" onClick={() => onSelect(null)}>
                            Clear
                        </button>)}
                </h4>
                {allRows.length === 0 ? (
                    <p className="text-sm text-base-content/60 mt-0 mb-0">No devices.</p>
                ) : (
                    <>
                        <TableFilter value={filter} onChange={setFilter} placeholder={`Filter ${title.toLowerCase()}`} className="w-full" />
                        <table className="table table-zebra table-sm w-full mt-0 mb-0">
                            <thead>
                                <tr>
                                    <SortableHeader label={title} sortKey="label" sort={sort} onSort={onSort} className="w-1/2" />
                                    <th className="w-1/3"><span className="sr-only">Share</span></th>
                                    <SortableHeader label="Devices" sortKey="count" sort={sort} onSort={onSort} className="text-right" />
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="text-base-content/60">No values match the filter.</td>
                                    </tr>)}
                                {rows.map(([label, count]) => (
                                    <tr key={label} className={selected === label ? "bg-primary/20" : ""}>
                                        <td>
                                            {onSelect ? (
                                                <button
                                                    type="button"
                                                    className="link link-hover text-left mt-0"
                                                    aria-pressed={selected === label}
                                                    onClick={() => onSelect(selected === label ? null : label)}
                                                >
                                                    {label}
                                                </button>
                                            ) : label}
                                        </td>
                                        <td>
                                            <progress
                                                className="progress progress-primary w-full"
                                                value={count}
                                                max={Math.max(total, 1)}
                                                aria-label={`${label}: ${count} of ${total}`}
                                            ></progress>
                                        </td>
                                        <td className="text-right">{count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>)}
            </div>
        </div>);
}
