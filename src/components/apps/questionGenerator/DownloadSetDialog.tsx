import { AuthManager } from 'types/AuthManager';
import { useState, useRef } from "react";
import { QuestionGeneratorService, QuestionOutputFormat, QuestionSelectionCriteria } from 'types/services/QuestionGeneratorService';
import FontAwesomeIcon from "../../FontAwesomeIcon";
import FormatSelector, { DEFAULT_COLUMN, DEFAULT_FONT, DEFAULT_SIZE } from './FormatSelector';
import { sharedGlobalStatusToast } from "utils/SharedState";
import type { RemoteServiceError } from 'types/services/RemoteServiceUtility';
import { DataTypeHelpers } from 'utils/DataTypeHelpers';

interface Props {
    criteria: QuestionSelectionCriteria;
    onClose: () => void;
}

export default function DownloadSetDialog({ criteria, onClose }: Props) {

    const auth = AuthManager.useNanoStore();
    const formRef = useRef<HTMLFormElement>(null);

    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [title, setTitle] = useState<string>("Generated");
    const [font, setFont] = useState<string>(DEFAULT_FONT);
    const [fontSize, setFontSize] = useState<number>(DEFAULT_SIZE);
    const [columns, setColumns] = useState<number>(DEFAULT_COLUMN);
    const [seed, setSeed] = useState<string | null>(criteria.Seed);

    const [latestError, setLatestError] = useState<string | null>(null);

    const handleDownload = async (event: React.MouseEvent<HTMLButtonElement>, format: QuestionOutputFormat) => {
        event.preventDefault();

        // Validate the form before proceeding
        if (formRef.current && !formRef.current.checkValidity()) {
            // This will show the browser's default validation messages
            formRef.current.reportValidity();
            return;
        }

        setIsDownloading(true);

        criteria.Title = title;
        criteria.Seed = seed ?? null;

        sharedGlobalStatusToast.set({
            type: "success",
            title: "Preparing",
            message: "We are preparing the question set now ...",
            showLoading: true,
            keepOpen: true,
        });

        await QuestionGeneratorService.downloadFile(
            auth,
            criteria,
            format,
            font,
            fontSize,
            columns)
            .then(() => sharedGlobalStatusToast.set(null))
            .catch((error: RemoteServiceError) => {
                sharedGlobalStatusToast.set(null);
                setLatestError(error.message);
            });

        setIsDownloading(false);
    };

    return (
        <dialog className="modal" open>
            <div className="modal-box w-11/12 max-w-full md:w-3/4 lg:w-1/2">
                <h3 className="font-bold text-xl">Save as Template</h3>
                <div role="alert" className="alert alert-warning block">
                    <div>
                        <FontAwesomeIcon icon="fas faLightbulb" classNames={["mr-2"]} />
                        <span className="text-lg font-bold">IMPORTANT</span>
                    </div>
                    <div className="mt-0">
                        This will create
                        Be sure to download the PDF and ScoreKeep file from this
                        dialog <b><i>before</i></b> closing it. A new random order (i.e.,
                        seed) will be used if you close and reopen the dialog.
                    </div>
                </div>
                {latestError && (
                    <div className={`alert alert-error flex flex-col`}>
                        <p className="text-sm">
                            <FontAwesomeIcon icon="fas faCircleExclamation" classNames={["mr-2"]} />&nbsp;
                            <b>Failed to Download File: </b>{latestError}
                        </p>
                    </div>)}
                <form ref={formRef} method="dialog" className="gap-2" onSubmit={onClose}>
                    <div className="w-full mt-0">
                        <label className="label">
                            <span className="label-text font-medium">Title</span>
                            <span className="label-text-alt text-error">*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Enter title for the set"
                            className="input input-bordered w-full"
                            maxLength={80}
                            required
                        />
                    </div>
                    <FormatSelector
                        font={font}
                        setFont={setFont}
                        size={fontSize}
                        setSize={setFontSize}
                        columns={columns}
                        setColumns={setColumns}
                    />
                    <div className="w-full">
                        <label className="label">
                            <span className="label-text font-medium">Randomization Seed</span>
                            <span className="label-text-alt text-error">*</span>
                        </label>
                        <input
                            type="text"
                            name="seed"
                            value={seed ?? undefined}
                            onChange={e => setSeed(e.target.value)}
                            placeholder="Enter randomization seed"
                            className="input input-bordered w-full"
                            maxLength={80}
                            required
                        />
                        <small>
                            Set this value to regenerate a previously generated set. You won't usually need this field.
                        </small>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            className="btn btn-success mb-4 mt-0"
                            disabled={isDownloading}
                            onClick={e => handleDownload(e, QuestionOutputFormat.Pdf)}
                        >
                            <FontAwesomeIcon icon="fas faFilePdf" classNames={["mr-2"]} />
                            PDF
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary mb-4 mt-0"
                            disabled={isDownloading}
                            onClick={e => handleDownload(e, QuestionOutputFormat.ScoreKeep)}
                        >
                            <FontAwesomeIcon icon="fas faFileDownload" classNames={["mr-2"]} />
                            ScoreKeep
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary mb-4 mt-0"
                            disabled={isDownloading}
                            onClick={() => onClose()}
                        >
                            <FontAwesomeIcon icon="fas faCircleXmark" classNames={["mr-2"]} />
                            Close
                        </button>
                    </div>
                </form>
            </div>
        </dialog>);
}