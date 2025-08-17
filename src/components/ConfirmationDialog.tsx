import { useEffect } from "react";

interface Props {
    title: string;
    children: React.ReactNode;
    yesLabel?: string;
    onYes: () => void;
    noLabel?: string;
    onNo?: () => void;
}

const CONFIRMATION_DIALOG_ID = "confirmation-dialog";

export default function ConfirmationDialog({ title, children, yesLabel, onYes, noLabel, onNo }: Props) {

    return (
        <dialog id={CONFIRMATION_DIALOG_ID} className="modal" open>
            <div className="modal-box w-11/12 max-w-full md:w-3/4 lg:w-1/2">
                <h3 className="font-bold text-lg">{title}</h3>
                <div>
                    {children}
                </div>
                <div className="mt-2 text-center">
                    <form method="dialog">
                        <button
                            className="btn btn-primary"
                            type="button"
                            tabIndex={1}
                            onClick={() => {
                                if (onYes) {
                                    onYes();
                                }

                                (document.getElementById(CONFIRMATION_DIALOG_ID) as any).close();
                            }}>
                            {yesLabel || "Yes"}
                        </button>
                        {noLabel && (
                            <button
                                className="btn btn-warning ml-2"
                                type="button"
                                tabIndex={2}
                                onClick={() => {
                                    if (onNo) {
                                        onNo();
                                    }

                                    (document.getElementById(CONFIRMATION_DIALOG_ID) as any).close();
                                }}>
                                {noLabel || "No"}
                            </button>)}
                    </form>
                </div>
            </div>
        </dialog>);
}