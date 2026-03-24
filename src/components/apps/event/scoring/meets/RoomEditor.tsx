import { useState, useEffect } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";

export enum RoomNameFormat {
    Numbers = 0,
    Letters = 1,
    LetterNumber = 2
}

export interface RoomNamePattern {
    format: RoomNameFormat;
    prefix: string;
}

/**
 * Detects the naming pattern from existing room names
 */
export function detectRoomNamePattern(names: string[]): RoomNamePattern {
    const trimmedNames = names
        .map(n => n.trim().replace(/-+$/, "").replace(/^-+/, ""))
        .filter(n => n.length > 0);

    if (trimmedNames.length === 0) {
        return { format: RoomNameFormat.Numbers, prefix: "1" };
    }

    // Check if all names are numbers
    const numbers = trimmedNames
        .map(n => parseInt(n, 10))
        .filter(n => !isNaN(n));

    if (numbers.length === trimmedNames.length) {
        const minValue = Math.min(...numbers);
        return { format: RoomNameFormat.Numbers, prefix: minValue > 0 ? minValue.toString() : "1" };
    }

    // Check if all names are single letters
    if (trimmedNames.every(n => n.length === 1 && /^[A-Za-z]$/.test(n))) {
        return { format: RoomNameFormat.Letters, prefix: trimmedNames[0].toUpperCase() };
    }

    // Check if all names are letter+number format (e.g., A1, A2, B1)
    if (trimmedNames.every(n => n.length === 2 && /^[A-Za-z][0-9]$/.test(n))) {
        const distinctLetters = [...new Set(trimmedNames.map(n => n[0].toUpperCase()))];
        if (distinctLetters.length === 1) {
            return { format: RoomNameFormat.LetterNumber, prefix: distinctLetters[0] };
        }
    }

    // Default fallback to numbers
    return { format: RoomNameFormat.Numbers, prefix: "1" };
}

/**
 * Generates a room name based on the format and index
 */
export function generateRoomName(index: number, format: RoomNameFormat, prefix: string): string {
    switch (format) {
        case RoomNameFormat.Numbers: {
            const startNum = parseInt(prefix, 10) || 1;
            return (startNum + index).toString();
        }
        case RoomNameFormat.Letters: {
            const startChar = prefix.toUpperCase().charCodeAt(0);
            const charCode = startChar + index;
            // If we exceed 'Z', fall back to numbers
            if (charCode > 90) {
                return (index + 1).toString();
            }
            return String.fromCharCode(charCode);
        }
        case RoomNameFormat.LetterNumber: {
            const letter = (prefix[0] || "A").toUpperCase();
            const num = index + 1;
            // If number exceeds 9, fall back to just numbers
            if (num > 9) {
                return num.toString();
            }
            return `${letter}${num}`;
        }
        default:
            return (index + 1).toString();
    }
}

/**
 * Generates room names for a target count, preserving existing names and following the detected pattern
 */
export function generateRoomNamesForCount(existingNames: string[], targetCount: number): string[] {
    if (targetCount <= existingNames.length) {
        // Just truncate if we need fewer rooms
        return existingNames.slice(0, targetCount);
    }

    // Detect the pattern from existing names
    const pattern = detectRoomNamePattern(existingNames);

    // Build the new array: keep existing names, generate new ones following the pattern
    const newRooms: string[] = [];
    for (let i = 0; i < targetCount; i++) {
        if (i < existingNames.length) {
            newRooms.push(existingNames[i]);
        } else {
            newRooms.push(generateRoomName(i, pattern.format, pattern.prefix));
        }
    }

    return newRooms;
}

interface Props {
    roomNames: string[];
    disabled: boolean;
    isReadOnly: boolean;
    isOutOfDate?: boolean;
    onRoomNamesChange: (roomNames: string[]) => void;
}

export default function RoomEditor({
    roomNames,
    disabled,
    isReadOnly,
    onRoomNamesChange
}: Props) {
    const [format, setFormat] = useState<RoomNameFormat>(RoomNameFormat.Numbers);
    const [prefix, setPrefix] = useState("1");

    // Detect pattern on initial load
    useEffect(() => {
        if (roomNames.length > 0) {
            const detected = detectRoomNamePattern(roomNames);
            setFormat(detected.format);
            setPrefix(detected.prefix);
        }
    }, []); // Only run on mount

    // Validate and sanitize room name: max 2 chars, alphanumeric or dash, cannot start with dash
    const sanitizeRoomName = (value: string): string => {
        // Convert to uppercase
        let sanitized = value.toUpperCase();
        // Remove any characters that aren't alphanumeric or dash
        sanitized = sanitized.replace(/[^A-Z0-9-]/g, "");
        // Remove leading dashes
        sanitized = sanitized.replace(/^-+/, "");
        // Limit to 2 characters
        return sanitized.slice(0, 2);
    };

    const handleRoomNameChange = (index: number, value: string) => {
        const sanitized = sanitizeRoomName(value);
        const updated = [...roomNames];
        updated[index] = sanitized;
        onRoomNamesChange(updated);
    };

    const handlePrefixChange = (value: string) => {
        // For numbers format, only allow digits
        if (format === RoomNameFormat.Numbers) {
            const numericValue = value.replace(/[^0-9]/g, "");
            setPrefix(numericValue || "1");
        } else {
            // For letter formats, only allow a single letter
            const letterValue = value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 1);
            setPrefix(letterValue || "A");
        }
    };

    const applyFormat = (newFormat: RoomNameFormat) => {
        // Update prefix to appropriate default if switching formats
        let newPrefix = prefix;
        if (newFormat === RoomNameFormat.Numbers && !/^\d+$/.test(prefix)) {
            newPrefix = "1";
        } else if ((newFormat === RoomNameFormat.Letters || newFormat === RoomNameFormat.LetterNumber) && !/^[A-Z]$/.test(prefix)) {
            newPrefix = "A";
        }

        setFormat(newFormat);
        setPrefix(newPrefix);

        // Generate new room names
        const newNames = roomNames.map((_, index) => generateRoomName(index, newFormat, newPrefix));
        onRoomNamesChange(newNames);
    };

    // Get placeholder text for prefix input
    const getPrefixPlaceholder = (): string => {
        switch (format) {
            case RoomNameFormat.Numbers:
                return "1";
            case RoomNameFormat.Letters:
            case RoomNameFormat.LetterNumber:
                return "A";
            default:
                return "1";
        }
    };

    // Get label for prefix input
    const getPrefixLabel = (): string => {
        switch (format) {
            case RoomNameFormat.Numbers:
                return "Start #";
            case RoomNameFormat.Letters:
                return "Start";
            case RoomNameFormat.LetterNumber:
                return "Prefix";
            default:
                return "Start";
        }
    };

    return (
        <div className="p-2 space-y-3 mt-0 mb-0">
            {/* Format buttons */}
            {!isReadOnly && (
                <div className="flex flex-wrap items-center gap-2 mt-0 mb-0">
                    <div className="flex items-center gap-1">
                        <label className="label-text text-xs">{getPrefixLabel()}:</label>
                        <input
                            type="text"
                            className="input input-xs input-bordered w-12 text-center font-mono"
                            value={prefix}
                            onChange={(e) => handlePrefixChange(e.target.value)}
                            disabled={disabled}
                            placeholder={getPrefixPlaceholder()}
                            maxLength={format === RoomNameFormat.Numbers ? 3 : 1}
                        />
                    </div>
                    <button
                        type="button"
                        className={`btn btn-xs mt-0 mb-0 ${format === RoomNameFormat.Numbers ? "btn-primary" : "btn-outline"}`}
                        onClick={() => applyFormat(RoomNameFormat.Numbers)}
                        disabled={disabled || roomNames.length === 0}
                        title="Number rooms sequentially (1, 2, 3...)"
                    >
                        <FontAwesomeIcon icon="fas faHashtag" />
                        1, 2, 3
                    </button>
                    <button
                        type="button"
                        className={`btn btn-xs mt-0 mb-0 ${format === RoomNameFormat.Letters ? "btn-primary" : "btn-outline"}`}
                        onClick={() => applyFormat(RoomNameFormat.Letters)}
                        disabled={disabled || roomNames.length === 0}
                        title="Letter rooms sequentially (A, B, C...)"
                    >
                        <FontAwesomeIcon icon="fas faFont" />
                        A, B, C
                    </button>
                    <button
                        type="button"
                        className={`btn btn-xs mt-0 mb-0 ${format === RoomNameFormat.LetterNumber ? "btn-primary" : "btn-outline"}`}
                        onClick={() => applyFormat(RoomNameFormat.LetterNumber)}
                        disabled={disabled || roomNames.length === 0}
                        title="Letter prefix with numbers (A1, A2, A3...)"
                    >
                        <FontAwesomeIcon icon="fas faDoorOpen" />
                        A1, A2, A3
                    </button>
                </div>
            )}

            {/* Room name inputs */}
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1">
                {roomNames.map((roomName, index) => (
                    <input
                        key={index}
                        type="text"
                        className="input input-sm input-bordered w-full text-center font-mono"
                        value={roomName}
                        onChange={(e) => handleRoomNameChange(index, e.target.value)}
                        disabled={disabled || isReadOnly}
                        maxLength={2}
                        pattern="^[A-Z0-9][A-Z0-9\-]?$"
                        title="1-2 uppercase alphanumeric characters or dash (cannot start with dash)"
                        placeholder={generateRoomName(index, format, prefix)}
                    />
                ))}
            </div>

            {roomNames.length === 0 && (
                <p className="text-sm italic text-base-content/60">
                    No rooms configured. Refresh the schedule preview to add rooms.
                </p>
            )}
        </div>
    );
}