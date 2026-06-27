import { useRef, useState, useCallback } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import ConfirmationDialog from "components/ConfirmationDialog";
import { useModalDialog } from "hooks/useModalDialog";
import type { AuthManager } from "types/AuthManager";
import {
    DatabasesService,
    AwardType,
    type DatabaseAwardsOutput,
    type DatabaseAwardsTemplate
} from "types/services/DatabasesService";
import AwardUploadTemplateDialog from "./AwardUploadTemplateDialog";

interface Props {
    auth: AuthManager;
    eventId: string;
    databaseId: string;
    type: AwardType;
    typeName: string;
    output: DatabaseAwardsOutput;
    onClose: (updatedOutput: DatabaseAwardsOutput) => void;
}

interface DeleteConfirmation {
    template: DatabaseAwardsTemplate;
    action: () => void;
}

interface UnlinkConfirmation {
    template: DatabaseAwardsTemplate;
    action: () => void;
}

export default function AwardTemplatesDialog({
    auth,
    eventId,
    databaseId,
    type,
    typeName,
    output,
    onClose
}: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    // Local copy of output that we'll modify
    const [localOutput, setLocalOutput] = useState<DatabaseAwardsOutput>({ ...output, AllTemplates: [...output.AllTemplates] });

    // Dialog states
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Nested dialogs
    const [uploadingTemplate, setUploadingTemplate] = useState<DatabaseAwardsTemplate | null | "new">(null);
    const [confirmDelete, setConfirmDelete] = useState<DeleteConfirmation | null>(null);
    const [confirmUnlink, setConfirmUnlink] = useState<UnlinkConfirmation | null>(null);

    // Check if nested dialog is open
    const hasNestedDialog = uploadingTemplate !== null || confirmDelete !== null || confirmUnlink !== null;

    // Handle close
    const handleClose = useCallback(() => {
        if (!isProcessing && !hasNestedDialog) {
            onClose(localOutput);
        }
    }, [isProcessing, hasNestedDialog, localOutput, onClose]);

    // Promote to the browser's top layer so this dialog (and its nested dialogs)
    // stack above Starlight's header/sidebar and any parent dialog. showModal() puts
    // it in the top layer; the `open` attribute would render it inline. Escape
    // closes the dialog (only when no nested dialog is open and not processing).
    useModalDialog(dialogRef, handleClose, isProcessing || hasNestedDialog);

    // Get database templates and personal templates
    const databaseTemplates = localOutput.AllTemplates.filter(t => t.IsDatabase);
    const personalTemplates = localOutput.AllTemplates.filter(t => !t.IsDatabase);

    // Handle upload new template
    const handleUploadNew = () => {
        setUploadingTemplate("new");
    };

    // Handle upload/update existing template
    const handleUploadExisting = (template: DatabaseAwardsTemplate) => {
        setUploadingTemplate(template);
    };

    // Handle upload save
    const handleUploadSave = (newTemplate: DatabaseAwardsTemplate) => {
        setLocalOutput(prev => {
            const templates = [...prev.AllTemplates];
            const existingIndex = templates.findIndex(t => t.Id === newTemplate.Id);
            if (existingIndex >= 0) {
                templates[existingIndex] = newTemplate;
            } else {
                templates.push(newTemplate);
            }
            return { ...prev, AllTemplates: templates };
        });
        setUploadingTemplate(null);
    };

    // Handle upload close
    const handleUploadClose = () => {
        setUploadingTemplate(null);
    };

    // Handle download template
    const handleDownload = (template: DatabaseAwardsTemplate) => {
        window.open(template.DownloadLink);
    };

    // Handle download blank template
    const handleDownloadBlank = () => {
        window.open(localOutput.BlankTemplateLink);
    };

    // Handle link template to database
    const handleLink = async (template: DatabaseAwardsTemplate) => {
        setIsProcessing(true);
        setError(null);

        try {
            await DatabasesService.linkTemplateToDatabase(
                auth,
                eventId,
                databaseId,
                template.Id
            );

            setLocalOutput(prev => {
                const templates = prev.AllTemplates.map(t =>
                    t.Id === template.Id ? { ...t, IsDatabase: true } : t
                );
                return { ...prev, AllTemplates: templates };
            });
        } catch (err: any) {
            setError(err.message || "Failed to link template.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle unlink template from database
    const handleUnlink = (template: DatabaseAwardsTemplate) => {
        setConfirmUnlink({
            template,
            action: async () => {
                setConfirmUnlink(null);
                setIsProcessing(true);
                setError(null);

                try {
                    await DatabasesService.unlinkTemplateToDatabase(
                        auth,
                        eventId,
                        databaseId,
                        template.Id
                    );

                    setLocalOutput(prev => {
                        const templates = prev.AllTemplates.map(t =>
                            t.Id === template.Id ? { ...t, IsDatabase: false } : t
                        );
                        return { ...prev, AllTemplates: templates };
                    });
                } catch (err: any) {
                    setError(err.message || "Failed to unlink template.");
                } finally {
                    setIsProcessing(false);
                }
            }
        });
    };

    // Handle delete template
    const handleDelete = (template: DatabaseAwardsTemplate) => {
        setConfirmDelete({
            template,
            action: async () => {
                setConfirmDelete(null);
                setIsProcessing(true);
                setError(null);

                try {
                    await DatabasesService.deleteTemplate(
                        auth,
                        eventId,
                        template.Id
                    );

                    setLocalOutput(prev => {
                        const templates = prev.AllTemplates.filter(t => t.Id !== template.Id);
                        // If the deleted template was selected, select the first available one
                        let newTemplateId = prev.TemplateId;
                        if (prev.TemplateId === template.Id && templates.length > 0) {
                            newTemplateId = templates[0].Id;
                        }
                        return { ...prev, AllTemplates: templates, TemplateId: newTemplateId };
                    });
                } catch (err: any) {
                    setError(err.message || "Failed to delete template.");
                } finally {
                    setIsProcessing(false);
                }
            }
        });
    };

    // Render template row
    const renderTemplateRow = (template: DatabaseAwardsTemplate, showOwner: boolean, showDelete: boolean) => {
        const displayName = showOwner && template.OwnerName
            ? `${template.Name} (${template.OwnerName})`
            : template.Name;

        const isDefault = template.IsDefault;
        const isModifiable = template.IsModifiable;

        return (
            <div key={template.Id} className="flex items-center gap-2 py-1 border-b border-base-300 last:border-b-0 mt-0">
                {/* Upload button */}
                <button
                    type="button"
                    className="btn btn-sm btn-ghost mt-0"
                    onClick={() => handleUploadExisting(template)}
                    disabled={isDefault || !isModifiable || isProcessing}
                    title={`Upload new version of ${template.Name}`}
                >
                    <FontAwesomeIcon icon="fas faFileUpload" />
                </button>

                {/* Link/Unlink button */}
                {template.IsDatabase ? (
                    <button
                        type="button"
                        className="btn btn-sm btn-ghost mt-0"
                        onClick={() => handleUnlink(template)}
                        disabled={isDefault || isProcessing}
                        title={`Unlink ${template.Name} from database`}
                    >
                        <FontAwesomeIcon icon="fas faUnlink" />
                    </button>
                ) : (
                    <button
                        type="button"
                        className="btn btn-sm btn-ghost mt-0"
                        onClick={() => handleLink(template)}
                        disabled={isProcessing}
                        title={`Link ${template.Name} to database`}
                    >
                        <FontAwesomeIcon icon="fas faLink" />
                    </button>
                )}

                {/* Download button */}
                <button
                    type="button"
                    className="btn btn-sm btn-ghost mt-0"
                    onClick={() => handleDownload(template)}
                    disabled={isProcessing}
                    title={`Download ${template.Name}`}
                >
                    <FontAwesomeIcon icon="fas faFileDownload" />
                </button>

                {/* Delete button (only for personal templates) */}
                {showDelete && (
                    <button
                        type="button"
                        className="btn btn-sm btn-ghost text-error mt-0"
                        onClick={() => handleDelete(template)}
                        disabled={isDefault || !isModifiable || isProcessing}
                        title={`Delete ${template.Name}`}
                    >
                        <FontAwesomeIcon icon="fas faTrash" />
                    </button>
                )}

                {/* Template name */}
                <span className={`flex-1 ${isDefault ? "italic text-base-content/60" : ""}`}>
                    {displayName}
                    {isDefault && " (Default)"}
                </span>
            </div>
        );
    };

    return (
        <>
            <dialog ref={dialogRef} className="modal">
                <div className="modal-box w-11/12 max-w-2xl">
                    <h3 className="font-bold text-lg mb-4">
                        <FontAwesomeIcon icon="fas faFileAlt" />
                        <span className="ml-2">Manage {typeName} Templates</span>
                    </h3>

                    {error && (
                        <div role="alert" className="alert alert-error mb-4">
                            <FontAwesomeIcon icon="fas faTriangleExclamation" />
                            <span>{error}</span>
                            <button
                                type="button"
                                className="btn btn-sm btn-ghost"
                                onClick={() => setError(null)}
                            >
                                <FontAwesomeIcon icon="fas faTimes" />
                            </button>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 mb-4">
                        <button
                            type="button"
                            className="btn btn-primary btn-sm mt-0"
                            onClick={handleUploadNew}
                            disabled={isProcessing}
                        >
                            <FontAwesomeIcon icon="fas faUpload" />
                            Upload New Template
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm mt-0"
                            onClick={handleDownloadBlank}
                            disabled={isProcessing}
                        >
                            <FontAwesomeIcon icon="fas faDownload" />
                            Download Blank Template
                        </button>
                    </div>

                    {/* Database Templates */}
                    <div className="mb-4">
                        <h4 className="font-semibold text-md mb-2">
                            <FontAwesomeIcon icon="fas faDatabase" />
                            <span className="ml-2">Database Templates</span>
                        </h4>
                        <div className="rounded-lg p-0">
                            {databaseTemplates.length === 0 ? (
                                <p className="text-base-content/60 italic">No database templates</p>
                            ) : (
                                databaseTemplates.map(t => renderTemplateRow(t, true, false))
                            )}
                        </div>
                    </div>

                    {/* Personal Templates */}
                    <div className="mb-4">
                        <h4 className="font-semibold text-md mb-2">
                            <FontAwesomeIcon icon="fas faUser" />
                            <span className="ml-2">Personal Templates</span>
                        </h4>
                        <div className="rounded-lg p-0">
                            {personalTemplates.length === 0 ? (
                                <p className="text-base-content/60 italic">No personal templates</p>
                            ) : (
                                personalTemplates.map(t => renderTemplateRow(t, false, true))
                            )}
                        </div>
                    </div>

                    <div className="modal-action">
                        <button
                            type="button"
                            className="btn mt-0"
                            onClick={handleClose}
                            disabled={isProcessing}
                        >
                            Close
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={handleClose} disabled={isProcessing}>close</button>
                </form>
            </dialog>

            {/* Upload Template Dialog */}
            {uploadingTemplate !== null && (
                <AwardUploadTemplateDialog
                    auth={auth}
                    eventId={eventId}
                    databaseId={databaseId}
                    type={type}
                    template={uploadingTemplate === "new" ? null : uploadingTemplate}
                    onSave={handleUploadSave}
                    onClose={handleUploadClose}
                />
            )}

            {/* Delete Confirmation Dialog */}
            {confirmDelete && (
                <ConfirmationDialog
                    title="Delete Template"
                    yesLabel="Delete"
                    onYes={confirmDelete.action}
                    noLabel="Cancel"
                    onNo={() => setConfirmDelete(null)}
                >
                    <p className="py-4">
                        Are you sure you want to delete <strong>{confirmDelete.template.Name}</strong>? This action cannot be undone.
                    </p>
                </ConfirmationDialog>
            )}

            {/* Unlink Confirmation Dialog */}
            {confirmUnlink && (
                <ConfirmationDialog
                    title="Unlink Template"
                    yesLabel="Unlink"
                    onYes={confirmUnlink.action}
                    noLabel="Cancel"
                    onNo={() => setConfirmUnlink(null)}
                >
                    <p className="py-4">
                        Are you sure you want to unlink <strong>{confirmUnlink.template.Name}</strong> from this database?
                        If you don't own it, you won't be able to relink it.
                    </p>
                </ConfirmationDialog>
            )}
        </>
    );
}