import React, { useState, useRef, useEffect } from 'react';

interface Props {
    onPointsChange: (points: number[]) => void;
    initialPoints?: number[];
    disabled?: boolean;
    placeholder?: string;
}

const AVAILABLE_POINT_VALUES = [10, 20, 30];

export default function ManualQuestionPointValueSelector({
    onPointsChange,
    initialPoints = [],
    disabled = false,
    placeholder = "Click to add points ..." }: Props) {

    const [selectedPoints, setSelectedPoints] = useState<number[]>(initialPoints);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [inputFocused, setInputFocused] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const addPointValue = (point: number): void => {
        const newPoints = [...selectedPoints, point];
        setSelectedPoints(newPoints);
        setIsDropdownOpen(false);
        inputRef.current?.focus();
        onPointsChange?.(newPoints);
    };

    const removePointValue = (pointToRemove: number): void => {
        const newPoints = selectedPoints.filter((point: number) => point !== pointToRemove);
        setSelectedPoints(newPoints);
        onPointsChange?.(newPoints);
    };

    const handleInputClick = (): void => {
        if (!disabled) {
            setIsDropdownOpen(true);
        }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (disabled) return;

        if (e.key === 'Backspace' && selectedPoints.length > 0) {
            // Remove last badge if input is empty
            const inputValue = (e.target as HTMLInputElement).value;
            if (inputValue === '') {
                removePointValue(selectedPoints[selectedPoints.length - 1]);
            }
        } else if (e.key === 'Enter' || e.key === 'ArrowDown') {
            e.preventDefault();
            setIsDropdownOpen(true);
        } else if (e.key === 'Escape') {
            setIsDropdownOpen(false);
        }
    };

    const handleClickOutside = (event: MouseEvent): void => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsDropdownOpen(false);
        }
    };

    // Close dropdown when clicking outside

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return (): void => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="w-full max-w-md mx-auto p-6">
            <div className="form-control w-full">
                <label className="label">
                    <span className="label-text font-medium">Question Point Values</span>
                </label>

                <div className="relative" ref={dropdownRef}>
                    {/* Input container with badges */}
                    <div className={`input input-bordered flex flex-wrap items-center gap-1 p-2 min-h-12 cursor-text ${inputFocused ? 'input-primary' : ''
                        } ${disabled ? 'input-disabled cursor-not-allowed' : ''}`} onClick={handleInputClick}>

                        {/* Selected point badges */}
                        {selectedPoints.map((point: number) => (
                            <div key={point} className="badge badge-primary gap-2">
                                {point}
                                <button
                                    className="btn btn-ghost btn-xs p-0 w-4 h-4 min-h-0"
                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                        e.stopPropagation();
                                        removePointValue(point);
                                    }}
                                    disabled={disabled}
                                    type="button"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        {/* Hidden input for focus management */}
                        <input
                            ref={inputRef}
                            className="flex-1 outline-none bg-transparent min-w-20"
                            placeholder={selectedPoints.length === 0 ? placeholder : "Add more..."}
                            onFocus={() => setInputFocused(true)}
                            onBlur={() => setInputFocused(false)}
                            onKeyDown={handleInputKeyDown}
                            disabled={disabled}
                            readOnly
                        />
                    </div>

                    {/* Dropdown */}
                    {isDropdownOpen && !disabled && (
                        <select className="absolute top-full left-0 right-0 z-50 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-48 overflow-y-auto z-1000">
                            {AVAILABLE_POINT_VALUES.map((pointValue: number) => (
                                <option
                                    key={`available_${pointValue}`}
                                    className="w-full px-4 py-2 text-left hover:bg-base-200 focus:bg-base-200 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
                                    onClick={() => addPointValue(pointValue)}
                                >
                                    {pointValue} point{pointValue !== 1 ? 's' : ''}
                                </option>
                            ))}
                        </select>
                    )}
                    {/* Dropdown 
                    {isDropdownOpen && !disabled && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-48 overflow-y-auto z-1000">
                            {AVAILABLE_POINT_VALUES.map((pointValue: number) => (
                                <button
                                    key={`available_${pointValue}`}
                                    className="w-full px-4 py-2 text-left hover:bg-base-200 focus:bg-base-200 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
                                    onClick={() => addPointValue(pointValue)}
                                    type="button"
                                >
                                    {pointValue} point{pointValue !== 1 ? 's' : ''}
                                </button>
                            ))}
                        </div>
                    )}*/}
                </div>

                <label className="label">
                    <span className="label-text-alt">
                        {selectedPoints.length === 0
                            ? "No point values selected"
                            : `${selectedPoints.length} point value${selectedPoints.length !== 1 ? 's' : ''} selected`
                        }
                    </span>
                </label>
            </div>

            {/* Preview section */}
            {selectedPoints.length > 0 && (
                <div className="mt-6 p-4 bg-base-200 rounded-lg">
                    <h3 className="font-medium mb-2">Selected Point Values:</h3>
                    <div className="flex flex-wrap gap-2">
                        {selectedPoints
                            .sort((a, b) => a - b)
                            .map((point) => (
                                <div key={point} className="badge badge-outline">
                                    {point}
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
};
