import { useState, useRef, useEffect } from 'react';
import FontAwesomeIcon from './FontAwesomeIcon';

interface FilterProps {
    onFilterChange?: (filters: { categories: string[]; years: string[] }) => void;
}

export default function EventListFilter({ onFilterChange }: FilterProps) {
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedYears, setSelectedYears] = useState<string[]>([]);

    // Refs to manage dropdown state
    const categoryDropdownRef = useRef<HTMLDetailsElement>(null);
    const yearDropdownRef = useRef<HTMLDetailsElement>(null);

    const categories = ['JBQ', 'TBQ', 'Events', 'News'];
    const years = ['2024', '2023', '2022', '2021'];

    const toggleCategory = (cat: string) => {
        const newCategories = selectedCategories.includes(cat)
            ? selectedCategories.filter(c => c !== cat)
            : [...selectedCategories, cat];

        setSelectedCategories(newCategories);
        onFilterChange?.({ categories: newCategories, years: selectedYears });
    };

    const toggleYear = (yr: string) => {
        const newYears = selectedYears.includes(yr)
            ? selectedYears.filter(y => y !== yr)
            : [...selectedYears, yr];

        setSelectedYears(newYears);
        onFilterChange?.({ categories: selectedCategories, years: newYears });
    };

    const closeDropdown = (ref: React.RefObject<HTMLDetailsElement | null>) => {
        if (ref.current) {
            ref.current.removeAttribute('open');
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
                closeDropdown(categoryDropdownRef);
            }
            if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
                closeDropdown(yearDropdownRef);
            }
        };

        const handleDropdownToggle = (event: Event) => {
            const details = event.target as HTMLDetailsElement;
            if (details.hasAttribute('open')) {
                details.classList.remove("mb-4");
            }
            else {
                details.classList.add("mb-4");
            }
        };

        categoryDropdownRef.current?.addEventListener('toggle', handleDropdownToggle);
        yearDropdownRef.current?.addEventListener('toggle', handleDropdownToggle);

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            categoryDropdownRef.current?.removeEventListener('toggle', handleDropdownToggle);
            yearDropdownRef.current?.removeEventListener('toggle', handleDropdownToggle);
        };
    }, []);

    // Add state to track popover visibility
    const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);

    // Add useEffect to listen for popover toggle events
    useEffect(() => {
        const popover = document.getElementById('popover-1');

        const handleToggle = () => {
            setIsCategoryPopoverOpen(popover?.matches(':popover-open') || false);
        };

        popover?.addEventListener('toggle', handleToggle);

        return () => {
            popover?.removeEventListener('toggle', handleToggle);
        };
    }, []);

    const getCategoryLabel = () => {
        if (selectedCategories.length === 0) return 'All';
        if (selectedCategories.length === 1) return selectedCategories[0];
        return `${selectedCategories.length} selected`;
    };

    const getYearLabel = () => {
        if (selectedYears.length === 0) return 'All Years';
        if (selectedYears.length === 1) return selectedYears[0];
        return `${selectedYears.length} selected`;
    };

    return (
        <div className="flex flex-wrap gap-2 items-top mt-2">
            <div className="mt-0">
                {/* change popover-1 and --anchor-1 names. Use unique names for each dropdown */}
                {/* For TSX uncomment the commented types below */}
                <div className="indicator">
                    <span className="indicator-item badge badge-primary badge-sm">+1</span>
                    <button
                        className="btn btn-sm btn-outline"
                        popoverTarget="popover-1"
                        style={{ anchorName: "--anchor-1" } as React.CSSProperties}>
                        <FontAwesomeIcon icon={`fas ${isCategoryPopoverOpen ? "faCaretDown" : "faCaretRight"}`} />
                        Category: <span className="font-bold ml-1">{getCategoryLabel()}</span>
                    </button>
                </div>
                <div className="dropdown menu w-64 rounded-box bg-base-100 border-2 border-solidshadow-sm mt-1"
                    popover="auto"
                    id="popover-1"
                    style={{ positionAnchor: "--anchor-1" } as React.CSSProperties}>
                    <div className="form-control">
                        {categories.map(cat => (
                            <label key={cat} className="label cursor-pointer justify-start gap-2">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm"
                                    checked={selectedCategories.includes(cat)}
                                    onChange={() => toggleCategory(cat)}
                                />
                                <span className="label-text">{cat}</span>
                            </label>
                        ))}
                    </div>
                    <div className="divider my-2"></div>
                    <div className="flex gap-2">
                        <button
                            className="btn btn-xs btn-primary flex-1"
                            onClick={() => closeDropdown(categoryDropdownRef)}
                        >
                            Apply
                        </button>
                        <button
                            className="btn btn-xs btn-ghost flex-1"
                            onClick={() => {
                                setSelectedCategories([]);
                                onFilterChange?.({ categories: [], years: selectedYears });
                            }}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Clear All Filters Button */}
            {(selectedCategories.length > 0 || selectedYears.length > 0) && (
                <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                        setSelectedCategories([]);
                        setSelectedYears([]);
                        onFilterChange?.({ categories: [], years: [] });
                    }}
                >
                    Clear All Filters
                </button>
            )}
        </div>
    );
}