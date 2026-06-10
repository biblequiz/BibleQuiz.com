import { useRef, useState, useCallback } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useEscapeToClose } from "hooks/useEscapeToClose";
import type { AuthManager } from "types/AuthManager";
import { DatabasesService, AwardType, type DatabaseAwardsTemplate } from "types/services/DatabasesService";

interface Props {
    auth: AuthManager;
    eventId: string;
    databaseId: string;
    type: AwardType;
    template: DatabaseAwardsTemplate | null;
    onSave: (template: DatabaseAwardsTemplate) => void;
    onClose: () => void;
}

export default function AwardUploadTemplateDialog({
    auth,
    eventId,
    databaseId,
    type,
    template,
    onSave,
    onClose
}: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState(template?.Name || "");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEditing = template !== null;

    // Handle close
    const handleClose = useCallback(() => {
        if (!isSaving) {
            onClose();
        }
    }, [isSaving, onClose]);

    // Handle Escape key to close dialog.
    useEscapeToClose(handleClose, isSaving);

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
        } else {
            setSelectedFile(null);
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError("Template name is required.");
            return;
        }

        if (!isEditing && !selectedFile) {
            setError("Template file is required.");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("Name", name.trim());
            if (selectedFile) {
                formData.append("File", selectedFile);
            }

            const result = await DatabasesService.uploadTemplate(
                auth,
                eventId,
                databaseId,
                type,
                template?.Id,
                formData
            );

            onSave(result);
        } catch (err: any) {
            setError(err.message || "Failed to upload template.");
            setIsSaving(false);
        }
    };

    const dialogTitle = isEditing ? "Update Template" : "Upload New Template";
    const submitLabel = isEditing
        ? (selectedFile ? "Overwrite Existing Template" : "Update Existing Template")
        : "Upload New Template";

    return (
        <dialog ref={dialogRef} className="modal" open>
            <div className="modal-box w-11/12 max-w-md">
                <h3 className="font-bold text-lg mb-4">
                    <FontAwesomeIcon icon="fas faFileUpload" />
                    <span className="ml-2">{dialogTitle}</span>
                </h3>

                {error && (
                    <div role="alert" className="alert alert-error mb-4">
                        <FontAwesomeIcon icon="fas faTriangleExclamation" />
                        <span>{error}</span>
                    </div>
                )}

                <form ref={formRef} onSubmit={handleSubmit}>
                    <div className="form-control mb-4">
                        <label className="label">
                            <span className="label-text">Template Name</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            placeholder="Name"
                            maxLength={60}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            disabled={isSaving}
                        />
                    </div>

                    <div className="form-control mb-4">
                        <label className="label">
                            <span className="label-text">
                                {isEditing ? "Template File (if changing)" : "Template File"}
                            </span>
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="file-input file-input-bordered w-full"
                            accept=".docx,.doc"
                            onChange={handleFileChange}
                            required={!isEditing}
                            disabled={isSaving}
                        />
                        <label className="label">
                            <span className="label-text-alt">Word document (.docx) required</span>
                        </label>
                    </div>

                    <div className="modal-action">
                        <button
                            type="submit"
                            className="btn btn-primary mt-0"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon="fas faUpload" />
                                    {submitLabel}
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            className="btn mt-0"
                            onClick={handleClose}
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={handleClose} disabled={isSaving}>close</button>
            </form>
        </dialog>
    );
}