import { useState } from 'react';
import FontAwesomeIcon from './FontAwesomeIcon';

interface Props {
    id: string;
    label: string;
    allLabel?: string;
    type: EventFilterType;
    selected: string[];
    possible: string[];
    setSelected: (selected: string[]) => void;
}

export enum EventFilterType {
    MultiSelect
};

export default function EventListFilterButton({
    id,
    label,
    allLabel = "All",
    type,
    selected,
    possible,
    setSelected }: Props) {

    const [selectedItems, setSelectedItems] = useState(() => {
        return selected
            ? new Set<string>(selected)
            : new Set<string>();
    });
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSelected = new Set(selectedItems);
        if (e.target.checked) {
            newSelected.add(e.target.value);
        } else {
            newSelected.delete(e.target.value);
        }

        setSelectedItems(newSelected);
        setSelected(Array.from(newSelected));
    };

    return (
        <>
            <details className="dropdown p-0 border-none">
                <summary className="btn btn-sm btn-outline m-0">
                    {label}: <span className="font-bold ml-1">{selected.length > 0 ? selected[0] : allLabel}</span>
                </summary>
                <div className="dropdown-content menu bg-base-100 rounded-box z-1 w-64 border-2 border-solidshadow-sm mt-1 p-2">
                    <div className="form-control">
                        {type === EventFilterType.MultiSelect && possible.map(value => (
                            <label key={`possible-${id}-${value}`} className="label cursor-pointer justify-start gap-2">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm"
                                    checked={selectedItems.has(value)}
                                    onChange={handleCheckboxChange}
                                />
                                <span className="label-text">{value}</span>
                            </label>
                        ))}
                    </div>
                    <div className="divider my-2"></div>
                    <div className="flex gap-2">
                        <button
                            className="btn btn-xs btn-primary flex-1 mt-0"
                        >
                            Apply
                        </button>
                        <button
                            className="btn btn-xs btn-ghost flex-1 mt-0"
                            onClick={() => {
                                setSelectedItems(new Set<string>());
                                setSelected([]);
                            }}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </details >
            <div className="dropdown">
                <button tabIndex={0} role="button" className="btn btn-sm btn-outline m-0">
                    {label}: <span className="font-bold ml-1">{selected.length > 0 ? selected[0] : "All"}</span>
                </button>
                <div tabIndex={-1} className="dropdown-content menu bg-base-100 rounded-box z-1 w-64 border-2 border-solidshadow-sm mt-1 p-2">
                    <div className="form-control">
                        {type === EventFilterType.MultiSelect && possible.map(value => (
                            <label key={`possible-${id}-${value}`} className="label cursor-pointer justify-start gap-2">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm"
                                    checked={selectedItems.has(value)}
                                    onChange={handleCheckboxChange}
                                />
                                <span className="label-text">{value}</span>
                            </label>
                        ))}
                    </div>
                    <div className="divider my-2" />
                    <div className="flex gap-2">
                        <button
                            className="btn btn-xs btn-primary flex-1 mt-0"
                        >
                            Apply
                        </button>
                        <button
                            className="btn btn-xs btn-ghost flex-1 mt-0"
                            onClick={() => {
                                setSelectedItems(new Set<string>());
                                setSelected([]);
                            }}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 items-top mt-2">
                <div className="mt-0">
                    {/* change popover-1 and --anchor-1 names. Use unique names for each dropdown */}
                    {/* For TSX uncomment the commented types below */}
                    <div className="indicator">
                        {selectedItems.size > 1 && (
                            <span className="indicator-item badge badge-primary badge-sm">+{selectedItems.size - 1}</span>)}
                        <button
                            className="btn btn-sm btn-outline"
                            popoverTarget={`popover-${id}`}
                            style={{ anchorName: `--anchor-${id}` } as React.CSSProperties}>
                            <FontAwesomeIcon icon={`fas ${isPopupOpen ? "faCaretDown" : "faCaretRight"}`} />
                            {label}: <span className="font-bold ml-1">{selected.length > 0 ? selected[0] : "All"}</span>
                        </button>
                    </div>
                    <div className="dropdown menu w-64 rounded-box bg-base-100 border-2 border-solidshadow-sm mt-1"
                        popover="auto"
                        id={`popover-${id}`}
                        style={{ positionAnchor: `--anchor-${id}` } as React.CSSProperties}
                        onToggle={e => setIsPopupOpen(e.currentTarget.matches(':popover-open') || false)}>
                        <div className="form-control">
                            {type === EventFilterType.MultiSelect && possible.map(value => (
                                <label key={`possible-${id}-${value}`} className="label cursor-pointer justify-start gap-2">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-sm"
                                        checked={selectedItems.has(value)}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="label-text">{value}</span>
                                </label>
                            ))}
                        </div>
                        <div className="divider my-2"></div>
                        <div className="flex gap-2">
                            <button
                                className="btn btn-xs btn-primary flex-1 mt-0"
                            >
                                Apply
                            </button>
                            <button
                                className="btn btn-xs btn-ghost flex-1 mt-0"
                                onClick={() => {
                                    setSelectedItems(new Set<string>());
                                    setSelected([]);
                                }}
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}