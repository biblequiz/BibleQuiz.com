import { useState } from 'react';
import FontAwesomeIcon from './FontAwesomeIcon';

interface Props {
    id: string;
    label: string;
    indicator?: string;
    children: React.ReactNode;
    buttons?: boolean;
}

export default function FilterDropdownButton({
    id,
    label,
    indicator,
    children,
    buttons = true }: Props) {

    const [isPopupOpen, setIsPopupOpen] = useState(false);

    return (
        <div className="mt-2">
            <div className="indicator">
                {indicator && (
                    <span className="indicator-item badge badge-primary badge-sm">{indicator}</span>)}
                <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    popoverTarget={`popover-${id}`}
                    style={{ anchorName: `--anchor-${id}` } as React.CSSProperties}>
                    <FontAwesomeIcon
                        icon={`fas ${isPopupOpen ? "faCaretDown" : "faCaretRight"}`}
                        classNames={["fa-fw"]} />
                    {label}
                </button>
            </div>
            <div className="dropdown menu w-64 rounded-box bg-base-100 border-2 border-solid shadow-sm mt-1"
                popover="auto"
                id={`popover-${id}`}
                style={{ positionAnchor: `--anchor-${id}` } as React.CSSProperties}
                onToggle={e => setIsPopupOpen(e.currentTarget.matches(':popover-open') || false)}>
                {children}
                {buttons && (
                    <>
                        <div className="divider mt-1 mb-1" />
                        <button
                            className="btn btn-xs btn-outline flex-1 mt-0"
                        >
                            Apply Filters
                        </button>
                        <button
                            className="btn btn-xs btn-ghost flex-1 mt-0"
                            onClick={() => {
                            }}
                        >
                            Clear Filters
                        </button>
                    </>)}
            </div>
        </div>
    );
}