import { useRef, useState, useCallback } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";

interface Props {
    title: string;
    extensions: string[];
    onReadyForUpload: (formData: FormData | null) => Promise<void>;
}

export default function FileUploadDialog({
    title,
    extensions,
    onReadyForUpload
}: Props) {

    const dialogRef = useRef<HTMLDialogElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    // Build accept string from extensions (e.g., [".json", ".csv"] -> ".json,.csv")
    const acceptString = extensions.join(",");

    const validateFile = useCallback((file: File): boolean => {
        const fileName = file.name.toLowerCase();
        const isValid = extensions.some(ext => fileName.endsWith(ext.toLowerCase()));
        if (!isValid) {
            setError(`Invalid file type. Allowed types: ${extensions.join(", ")}`);
            return false;
        }
        setError(null);
        return true;
    }, [extensions]);

    const handleFileSelect = useCallback((file: File) => {
        if (validateFile(file)) {
            setSelectedFile(file);
        }
    }, [validateFile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append("name", selectedFile.name);
        formData.append("file", selectedFile);

        onReadyForUpload(formData)
            .then(() => {
                setIsUploading(false);
                dialogRef.current?.close();
            })
            .catch(err => {
                setIsUploading(false);
                setError(err.message || "An error occurred while uploading the file.");
            });
    };

    const handleCancel = () => {
        onReadyForUpload(null);
        dialogRef.current?.close();
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <dialog ref={dialogRef} className="modal" open>
            <div className="modal-box w-full max-w-lg">
                <h3 className="font-bold text-lg">{title}</h3>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={handleCancel}
                    disabled={isUploading}
                >✕</button>

                <div className="mt-4">
                    {error && (
                        <div role="alert" className="alert alert-error mb-4">
                            <FontAwesomeIcon icon="fas faCircleExclamation" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={acceptString}
                        onChange={handleInputChange}
                        className="hidden"
                        disabled={isUploading}
                    />

                    {/* Drag and drop zone */}
                    <div
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
                            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                            transition-colors duration-200
                            ${isDragOver ? "border-primary bg-primary/10" : "border-base-300 hover:border-primary"}
                            ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
                        `}
                    >
                        {selectedFile ? (
                            <div className="flex flex-col items-center gap-2">
                                <FontAwesomeIcon icon="fas faFileAlt" classNames={["text-4xl text-success"]} />
                                <div className="font-medium">{selectedFile.name}</div>
                                <div className="text-sm opacity-70">{formatFileSize(selectedFile.size)}</div>
                                {!isUploading && (
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline mt-2"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedFile(null);
                                            if (fileInputRef.current) {
                                                fileInputRef.current.value = "";
                                            }
                                        }}
                                    >
                                        <FontAwesomeIcon icon="fas faXmark" />
                                        Remove
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <FontAwesomeIcon icon="fas faCloudArrowUp" classNames={["text-4xl opacity-50"]} />
                                <div>
                                    <span className="font-medium">Click to select</span> or drag and drop
                                </div>
                                <div className="text-sm opacity-70">
                                    Accepted formats: {extensions.join(", ")}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Upload progress indicator */}
                {isUploading && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <span className="loading loading-spinner loading-md"></span>
                        <span>Processing file...</span>
                    </div>
                )}

                <div className="modal-action">
                    <button
                        type="button"
                        className="btn btn-primary mt-0"
                        onClick={handleUpload}
                        disabled={!selectedFile || isUploading}
                    >
                        <FontAwesomeIcon icon="fas faUpload" />
                        Upload
                    </button>
                    <button
                        type="button"
                        className="btn btn-warning mt-0"
                        onClick={handleCancel}
                        disabled={isUploading}
                    >
                        Cancel
                    </button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={handleCancel} disabled={isUploading}>close</button>
            </form>
        </dialog>
    );
}