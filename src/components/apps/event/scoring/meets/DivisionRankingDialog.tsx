import { useRef } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";

interface Props {
    meetId: number;
    meetName: string;
    onClose: () => void;
}

/**
 * Placeholder dialog for ranking configuration.
 * Full implementation will be added in a future iteration.
 */
export default function DivisionRankingDialog({
    meetName,
    onClose
}: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    return (
        <dialog ref={dialogRef} className="modal" open>
            <div className="modal-box w-full max-w-lg">
                <h3 className="font-bold text-lg">
                    <FontAwesomeIcon icon="fas faMedal" />
                    <span className="ml-2">Ranking Settings - {meetName}</span>
                </h3>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={onClose}
                >✕</button>

                <div className="mt-4">
                    <div className="alert alert-info">
                        <FontAwesomeIcon icon="fas faCircleInfo" />
                        <div>
                            <h4 className="font-bold">Coming Soon</h4>
                            <p className="text-sm">
                                Ranking configuration will be available in a future update.
                                This will allow you to override team and quizzer rankings
                                for this division.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-right">
                    <button
                        className="btn btn-sm btn-secondary"
                        type="button"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </dialog>
    );
}