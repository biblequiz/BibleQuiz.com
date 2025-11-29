import { useState, useRef, useEffect } from 'react';

interface FilterProps {
    onFilterChange?: (filters: { categories: string[]; years: string[] }) => void;
}

export default function SearchFilters({ onFilterChange }: FilterProps) {
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

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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
            {/* Category Dropdown with Multi-Select */}
            <details className="dropdown border-none" ref={categoryDropdownRef}>
                <summary className="btn btn-sm btn-outline">
                    Category: <span className="font-bold ml-1">{getCategoryLabel()}</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </summary>
                <div className="dropdown-content menu bg-base-100 rounded-box z-[1] w-64 p-4 shadow mt-0">
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
            </details>

            {/* Year Dropdown with Multi-Select */}
            <details className="dropdown mt-0 border-none" ref={yearDropdownRef}>
                <summary className="btn btn-sm btn-outline">
                    Year: <span className="font-bold ml-1">{getYearLabel()}</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </summary>
                <div className="dropdown-content menu bg-base-100 rounded-box z-[1] w-64 p-4 shadow mt-0">
                    <div className="form-control">
                        {years.map(yr => (
                            <label key={yr} className="label cursor-pointer justify-start gap-2">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm"
                                    checked={selectedYears.includes(yr)}
                                    onChange={() => toggleYear(yr)}
                                />
                                <span className="label-text">{yr}</span>
                            </label>
                        ))}
                    </div>
                    <div className="divider my-2"></div>
                    <div className="flex gap-2">
                        <button
                            className="btn btn-xs btn-primary flex-1"
                            onClick={() => closeDropdown(yearDropdownRef)}
                        >
                            Apply
                        </button>
                        <button
                            className="btn btn-xs btn-ghost flex-1"
                            onClick={() => {
                                setSelectedYears([]);
                                onFilterChange?.({ categories: selectedCategories, years: [] });
                            }}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </details>

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