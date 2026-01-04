import { useEffect, useRef, useState } from "react";
import { AuthManager } from 'types/AuthManager';
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { DatabaseReportsService } from "types/services/DatabaseReportsService";

interface Props {
    auth: AuthManager;
    eventId: string;
    reportId: string;
    isEventReport: boolean;
    onClose: () => void;
}

export default function EventReportViewDialog({
    auth,
    eventId,
    reportId,
    isEventReport,
    onClose }: Props) {

    const dialogRef = useRef<HTMLDialogElement>(null);

    const [html, setHtml] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);

        if (!isLoading) {
            setHtml(null);
            setError(null);

            DatabaseReportsService.generateEventOrSeasonReport(
                auth,
                eventId,
                reportId,
                isEventReport)
                .then(response => {
                    setHtml(response.Html);
                    setIsLoading(false);
                    setError(null);
                })
                .catch(err => {
                    setError(err.message ?? "Unknown error");
                    setIsLoading(false);
                    setHtml(null);
                });
        }
    }, [eventId, reportId]);

    return (
        <dialog ref={dialogRef} className="modal" open>
            <div className="modal-box w-11/12 max-w-7xl h-5/6">
                {isLoading && (
                    <div className="flex justify-center items-center">
                        <span className="loading loading-spinner loading-xl"></span>&nbsp;
                        Generating Report ...
                    </div>)}
                {error && (
                    <div className="hero bg-base-300 rounded-2xl shadow-lg">
                        <div className="hero-content text-center py-16 px-8">
                            <div className="max-w-4xl">
                                <h1 className="text-3xl font-bold text-base-content mb-4">
                                    <FontAwesomeIcon icon="fas faTriangleExclamation" />
                                    <span className="ml-4">Error</span>
                                </h1>
                                <p className="text-lg text-base-content/70 mb-8">
                                    {error}
                                </p>
                            </div>
                        </div>
                    </div>)}
                {html && (
                    <div className="overflow-y-auto max-h-[70vh]">
                        <div
                            className="mt-2 mb-2"
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    </div>)}
                <div className="divider mt-2 mb-2" />
                <div className="justify-end text-right">
                    <button
                        className="btn btn-sm btn-warning mt-0"
                        type="button"
                        disabled={isLoading}
                        tabIndex={1}
                        onClick={() => {
                            onClose();
                            dialogRef.current?.close();
                        }}>
                        Close
                    </button>
                </div>
            </div>
        </dialog>);
}