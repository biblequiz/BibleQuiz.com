import { useRef } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";

interface Props {
    hasCustomSchedule: boolean;
    isUploading: boolean;
    disabled: boolean;
    isReadOnly: boolean;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
}

export default function CustomScheduleUploader({
    hasCustomSchedule,
    isUploading,
    disabled,
    isReadOnly,
    onUpload,
    onRemove
}: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadComplete = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpload(e);
        // Reset file input after upload
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="p-2">
            {hasCustomSchedule ? (
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-success">
                        <FontAwesomeIcon icon="fas faCircleCheck" />
                        <span>Custom schedule is active</span>
                    </div>
                    {!isReadOnly && (
                        <button
                            type="button"
                            className="btn btn-sm btn-error btn-outline"
                            onClick={onRemove}
                            disabled={disabled}
                        >
                            <FontAwesomeIcon icon="fas faTrash" />
                            Remove Custom Schedule
                        </button>
                    )}
                </div>
            ) : (
                <div>
                    <p className="text-sm text-base-content/70 mb-3">
                        Upload an Excel file (.xlsx) to use a custom schedule template.
                    </p>
                    {!isReadOnly && (
                        <div className="flex items-center gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx"
                                className="file-input file-input-bordered file-input-sm w-full max-w-xs"
                                onChange={handleUploadComplete}
                                disabled={disabled || isUploading}
                            />
                            {isUploading && (
                                <span className="loading loading-spinner loading-sm"></span>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}