import { useRef, useState } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { AuthManager } from "types/AuthManager";
import { AstroMeetsService, type OnlineMeetSchedulingSettings } from "types/services/AstroMeetsService";

interface Props {
    hasCustomSchedule: boolean;
    isUploading: boolean;
    disabled: boolean;
    isReadOnly: boolean;
    isNew: boolean;
    auth: AuthManager;
    eventId: string;
    databaseId: string;
    meetId: number;
    getSchedulingSettings: () => OnlineMeetSchedulingSettings;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
}

export default function CustomScheduleUploader({
    hasCustomSchedule,
    isUploading,
    disabled,
    isReadOnly,
    isNew,
    auth,
    eventId,
    databaseId,
    meetId,
    getSchedulingSettings,
    onUpload,
    onRemove
}: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    const handleExportSchedule = async () => {
        setIsExporting(true);
        setExportError(null);
        try {
            const settings = getSchedulingSettings();
            await AstroMeetsService.getScheduleTemplate(auth, eventId, databaseId, meetId, settings);
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

    const controlsDisabled = disabled || isNew;

    return (
        <div className="p-2 space-y-3">
            {/* Help text for new divisions */}
            {isNew && (
                <div role="alert" className="alert alert-info alert-sm">
                    <FontAwesomeIcon icon="fas faCircleInfo" />
                    <span>Save the division first to enable custom schedule options.</span>
                </div>
            )}

            {exportError && (
                <div role="alert" className="alert alert-error alert-sm">
                    <FontAwesomeIcon icon="fas faCircleExclamation" />
                    <span>{exportError}</span>
                </div>
            )}

            {hasCustomSchedule && (
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
                {!isReadOnly && hasCustomSchedule && (
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
        </div>
    );
}