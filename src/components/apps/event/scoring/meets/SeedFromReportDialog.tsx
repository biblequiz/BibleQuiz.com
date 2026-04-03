import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { AuthManager } from "types/AuthManager";
import { AstroTeamsAndQuizzersService } from "types/services/AstroTeamsAndQuizzersService";

interface Props {
    auth: AuthManager;
    eventId: string;
    databaseId: string;
    isIndividualCompetition: boolean;
    onSeed: (ids: number[]) => void;
    onClose: () => void;
}

/**
 * Dialog for seeding teams or quizzers from an uploaded seed report file.
 */
export default function SeedFromReportDialog({
    auth,
    eventId,
    databaseId,
    isIndividualCompetition,
    onSeed,
    onClose
}: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const itemLabel = isIndividualCompetition ? "quizzers" : "teams";
    const itemLabelCapitalized = isIndividualCompetition ? "Quizzers" : "Teams";

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);
        setError(null);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError("Please select a file to upload.");
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            const ids = await AstroTeamsAndQuizzersService.parseSeedReport(
                auth,
                eventId,
                databaseId,
                formData,
                isIndividualCompetition
            );

            onSeed(ids);
        } catch (err: any) {
            setError(err.message || "Failed to parse seed report.");
            setIsUploading(false);
        }
    };

    const handleClearFile = () => {
        setSelectedFile(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const dialogContent = (
        <dialog ref={dialogRef} className="modal modal-open" open>
            <div className="modal-box w-full max-w-lg">
                <h3 className="font-bold text-lg">
                    <FontAwesomeIcon icon="fas faFileImport" />
                    <span className="ml-2">Seed from Report</span>
                </h3>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={onClose}
                    disabled={isUploading}
                >✕</button>

                <div className="mt-4">
                    <div className="alert alert-info mb-4">
                        <FontAwesomeIcon icon="fas faCircleInfo" />
                        <div className="text-sm">
                            <p className="font-semibold">Seed {itemLabelCapitalized} from Report</p>
                            <p className="mt-2">
                                Upload a seed report file to import the list of {itemLabel}. You can export the seed report from the Teams & Quizzers page
                                (for all available {itemLabel}) or from the Live Scores (ranks with stats).
                            </p>
                            <p className="mt-2">
                                The seed report file must contain the first sheet with a table containing an "Id" column (id for the {itemLabel}) and "Seed" column (numeric seed starting at 1).
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div role="alert" className="alert alert-error mb-4">
                            <FontAwesomeIcon icon="fas faCircleExclamation" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text font-medium">Select Seed Report File</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="file-input file-input-bordered w-full"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                            {selectedFile && (
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-square"
                                    onClick={handleClearFile}
                                    disabled={isUploading}
                                >
                                    <FontAwesomeIcon icon="fas faXmark" />
                                </button>
                            )}
                        </div>
                        {selectedFile && (
                            <label className="label">
                                <span className="label-text-alt text-success">
                                    <FontAwesomeIcon icon="fas faFile" classNames={["mr-1"]} />
                                    {selectedFile.name}
                                </span>
                            </label>
                        )}
                    </div>
                </div>

                <div className="mt-4 text-right gap-2 flex justify-end">
                    <button
                        className="btn btn-sm btn-primary"
                        type="button"
                        onClick={handleUpload}
                        disabled={isUploading || !selectedFile}
                    >
                        {isUploading ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon="fas faFileImport" />
                                Seed {itemLabelCapitalized}
                            </>
                        )}
                    </button>
                    <button
                        className="btn btn-sm btn-secondary"
                        type="button"
                        onClick={onClose}
                        disabled={isUploading}
                    >
                        Cancel
                    </button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button type="button" onClick={onClose} disabled={isUploading}>close</button>
            </form>
        </dialog>
    );

    // Use portal to render at document.body level, escaping parent stacking contexts
    return createPortal(dialogContent, document.body);
}