import { useRef, useState } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { AuthManager } from "types/AuthManager";
import { AstroMeetsService } from "types/services/AstroMeetsService";

interface Props {
    hasCustomSchedule: boolean;
    useCustomSchedule: boolean;
    isUploading: boolean;
    disabled: boolean;
    isReadOnly: boolean;
    isNew: boolean;
    auth: AuthManager;
    eventId: string;
    databaseId: string;
    meetId: number;
    teamCount: number;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
    onUseCustomScheduleChange: (checked: boolean) => void;
}

export default function CustomScheduleUploader({
    hasCustomSchedule,
    useCustomSchedule,
    isUploading,
    disabled,
    isReadOnly,
    isNew,
    auth,
    eventId,
    databaseId,
    meetId,
    teamCount,
    onUpload,
    onRemove,
    onUseCustomScheduleChange
}: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    const handleExportSchedule = async () => {
        setIsExporting(true);
        setExportError(null);
        try {
            await AstroMeetsService.getScheduleTemplate(auth, eventId, databaseId, meetId, teamCount);
        } catch (err: any) {
            setExportError(err.message || "Failed to export schedule.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleUploadComplete = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpload(e);
        // Reset file input after upload
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const controlsDisabled = disabled || !useCustomSchedule || isNew;

    return (
        <div className="p-2 space-y-3">
            {/* Help text for new divisions */}
            {isNew && (
                <div role="alert" className="alert alert-info alert-sm">
                    <FontAwesomeIcon icon="fas faCircleInfo" />
                    <span>Save the division first to enable custom schedule options.</span>
                </div>
            )}

            {/* Use Custom Schedule Checkbox */}
            <label className="label cursor-pointer gap-2 justify-start">
                <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={useCustomSchedule}
                    onChange={(e) => onUseCustomScheduleChange(e.target.checked)}
                    disabled={disabled || isReadOnly || isNew}
                />
                <span className="label-text">Use Custom Schedule</span>
            </label>

            {exportError && (
                <div role="alert" className="alert alert-error alert-sm">
                    <FontAwesomeIcon icon="fas faCircleExclamation" />
                    <span>{exportError}</span>
                </div>
            )}

            {hasCustomSchedule && useCustomSchedule && (
                <div className="flex items-center gap-2 text-success">
                    <FontAwesomeIcon icon="fas faCircleCheck" />
                    <span>Custom schedule is active</span>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
                {/* Export Button - only show for existing divisions */}
                {!isNew && (
                    <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={handleExportSchedule}
                        disabled={controlsDisabled || isExporting}
                    >
                        {isExporting ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Exporting...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon="fas faDownload" />
                                Export Last Saved Schedule
                            </>
                        )}
                    </button>
                )}

                {/* Upload Control */}
                {!isReadOnly && (
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx"
                            className="file-input file-input-bordered file-input-sm w-full max-w-xs"
                            onChange={handleUploadComplete}
                            disabled={controlsDisabled || isUploading}
                        />
                        {isUploading && (
                            <span className="loading loading-spinner loading-sm"></span>
                        )}
                    </>
                )}

                {/* Remove Button */}
                {!isReadOnly && hasCustomSchedule && useCustomSchedule && (
                    <button
                        type="button"
                        className="btn btn-sm btn-error btn-outline"
                        onClick={onRemove}
                        disabled={controlsDisabled}
                    >
                        <FontAwesomeIcon icon="fas faTrash" />
                        Remove
                    </button>
                )}
            </div>

            {!useCustomSchedule && (
                <p className="text-sm text-base-content/70">
                    Enable "Use Custom Schedule" to upload or export a custom schedule template.
                </p>
            )}
        </div>
    );
}