import FontAwesomeIcon from "components/FontAwesomeIcon";

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

/**
 * Table of device counts with a bar showing each count's share of the total, largest first.
 */
export default function DeviceCountsTable({ title, icon, counts, total, selected, onSelect }: Props) {
    const rows = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

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
                {rows.length === 0 ? (
                    <p className="text-sm text-base-content/60 mt-0 mb-0">No devices.</p>
                ) : (
                    <table className="table table-zebra table-sm w-full mt-0 mb-0">
                        <tbody>
                            {rows.map(([label, count]) => (
                                <tr key={label} className={selected === label ? "bg-primary/20" : ""}>
                                    <td className="w-1/2">
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
                                    <td className="w-1/3">
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
                    </table>)}
            </div>
        </div>);
}
