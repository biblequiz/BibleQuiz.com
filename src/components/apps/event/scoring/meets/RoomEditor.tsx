import FontAwesomeIcon from "components/FontAwesomeIcon";

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
    // Validate and sanitize room name: max 2 chars, alphanumeric or dash, cannot start with dash
    const sanitizeRoomName = (value: string): string => {
        // Remove any characters that aren't alphanumeric or dash
        let sanitized = value.replace(/[^a-zA-Z0-9-]/g, '');
        // Remove leading dashes
        sanitized = sanitized.replace(/^-+/, '');
        // Limit to 2 characters
        return sanitized.slice(0, 2);
    };

    const handleRoomNameChange = (index: number, value: string) => {
        const sanitized = sanitizeRoomName(value);
        const updated = [...roomNames];
        updated[index] = sanitized;
        onRoomNamesChange(updated);
    };

    const handleRemoveRoom = (index: number) => {
        onRoomNamesChange(roomNames.filter((_, i) => i !== index));
    };

    return (
        <div className="p-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {roomNames.map((roomName, index) => (
                    <div key={index} className="flex items-center gap-1">
                        <input
                            type="text"
                            className="input input-sm input-bordered w-16 text-center font-mono"
                            value={roomName}
                            onChange={(e) => handleRoomNameChange(index, e.target.value)}
                            disabled={disabled || isReadOnly}
                            maxLength={2}
                            pattern="^[a-zA-Z0-9][a-zA-Z0-9-]?$"
                            title="1-2 alphanumeric characters or dash (cannot start with dash)"
                            placeholder="A"
                        />
                        {!isReadOnly && roomNames.length > 1 && (
                            <button
                                type="button"
                                className="btn btn-ghost btn-xs text-error"
                                onClick={() => handleRemoveRoom(index)}
                                disabled={disabled}
                            >
                                <FontAwesomeIcon icon="fas faXmark" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
            {roomNames.length === 0 && (
                <p className="text-sm italic text-base-content/60">
                    No rooms configured. Add rooms or refresh the schedule preview.
                </p>
            )}
        </div>
    );
}