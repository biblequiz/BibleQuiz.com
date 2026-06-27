import { useRef } from "react";
import { useModalDialog } from "hooks/useModalDialog";

interface Props {
    title: string;
    children: React.ReactNode;
    yesLabel?: string;
    onYes: () => void;
    noLabel?: string;
    onNo?: () => void;
    className?: string;
}

export default function ConfirmationDialog({
    title,
    children,
    yesLabel,
    onYes,
    noLabel,
    onNo,
    className }: Props) {

    const dialogRef = useRef<HTMLDialogElement>(null);

    const sizeClassName = className ? className : "w-11/12 max-w-full md:w-3/4 lg:w-1/2";

    // Promote to the browser's top layer so this dialog always stacks above any
    // parent modal that opened it. A native <dialog> only joins the top layer when
    // opened via showModal(); the `open` attribute renders it inline (subject to
    // ancestor stacking contexts), which fails for nested dialogs. Escape dismisses
    // the dialog, matching the "No" button.
    useModalDialog(dialogRef, () => {
        if (onNo) {
            onNo();
        }

        dialogRef.current?.close();
    });

    return (
        <dialog ref={dialogRef} className="modal">
            <div className={`modal-box ${sizeClassName}`}>
                <h3 className="font-bold text-lg">{title}</h3>
                <div>
                    {children}
                </div>
                <div className="mt-2 text-center">
                    <form method="dialog gap-2">
                        <button
                            className="btn btn-primary mr-2 mt-0"
                            type="button"
                            tabIndex={1}
                            onClick={() => {
                                if (onYes) {
                                    onYes();
                                }

                                dialogRef.current?.close();
                            }}>
                            {yesLabel || "Yes"}
                        </button>
                        {noLabel && (
                            <button
                                className="btn btn-warning mt-0"
                                type="button"
                                tabIndex={2}
                                onClick={() => {
                                    if (onNo) {
                                        onNo();
                                    }

                                    dialogRef.current?.close();
                                }}>
                                {noLabel || "No"}
                            </button>)}
                    </form>
                </div>
            </div>
        </dialog>);
}