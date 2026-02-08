import { useRef, useEffect } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";

export type StatsType = "team" | "quizzer";

interface Props {
    type: StatsType;
    id: number;
    name: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function StatsDialog({ type, id, name, isOpen, onClose }: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen]);

    const handleClose = () => {
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    const typeLabel = type === "team" ? "Team" : "Quizzer";
    const icon = type === "team" ? "fas faUsers" : "fas faUser";

    return (
        <dialog ref={dialogRef} className="modal" onClose={handleClose}>
            <div className="modal-box w-full max-w-2xl">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <FontAwesomeIcon icon={icon} />
                    {typeLabel} Statistics: {name}
                </h3>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={handleClose}
                >
                    ✕
                </button>

                <div className="mt-4">
                    {/* Placeholder content */}
                    <div className="p-8 border border-dashed border-base-300 rounded-lg bg-base-200 text-center">
                        <FontAwesomeIcon icon="fas faChartBar" classNames={["text-4xl", "text-base-content/40", "mb-4"]} />
                        <p className="text-base-content/60 text-lg">
                            {typeLabel} statistics will be displayed here.
                        </p>
                        <p className="text-base-content/40 text-sm mt-2">
                            ID: {id}
                        </p>
                    </div>

                    {/* Example placeholder sections */}
                    <div className="mt-6 space-y-4">
                        <div className="collapse collapse-arrow bg-base-200">
                            <input type="checkbox" defaultChecked />
                            <div className="collapse-title font-medium">
                                <FontAwesomeIcon icon="fas faChartLine" />
                                <span className="ml-2">Performance Summary</span>
                            </div>
                            <div className="collapse-content">
                                <p className="text-base-content/60 italic">
                                    Performance data will be loaded here...
                                </p>
                            </div>
                        </div>

                        <div className="collapse collapse-arrow bg-base-200">
                            <input type="checkbox" />
                            <div className="collapse-title font-medium">
                                <FontAwesomeIcon icon="fas faCalendar" />
                                <span className="ml-2">Meet History</span>
                            </div>
                            <div className="collapse-content">
                                <p className="text-base-content/60 italic">
                                    Meet participation history will be loaded here...
                                </p>
                            </div>
                        </div>

                        {type === "team" && (
                            <div className="collapse collapse-arrow bg-base-200">
                                <input type="checkbox" />
                                <div className="collapse-title font-medium">
                                    <FontAwesomeIcon icon="fas faUserGroup" />
                                    <span className="ml-2">Roster</span>
                                </div>
                                <div className="collapse-content">
                                    <p className="text-base-content/60 italic">
                                        Team roster details will be loaded here...
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-action">
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={handleClose}
                    >
                        Close
                    </button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={handleClose}>close</button>
            </form>
        </dialog>
    );
}