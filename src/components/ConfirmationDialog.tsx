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
    const closeActionRef = useRef<'yes' | 'no' | null>(null);

    const sizeClassName = className ? className : "w-11/12 max-w-full md:w-3/4 lg:w-1/2";

    // Promote to the browser's top layer so this dialog always stacks above any
    // parent modal that opened it. A native <dialog> only joins the top layer when
    // opened via showModal(); the `open` attribute renders it inline (subject to
    // ancestor stacking contexts), which fails for nested dialogs. Escape dismisses
    // the dialog, matching the "No" button.
    useModalDialog(dialogRef, () => {
        closeActionRef.current = 'no';
        dialogRef.current?.close();
    });

    const handleDialogClose = () => {
        const action = closeActionRef.current;
        closeActionRef.current = null;

        if (action === 'yes') {
            onYes();
            return;
        }

        // Treat "no" and implicit closes (backdrop/native close) as cancellation.
        if (onNo) {
            onNo();
        }
    };

    return (
        <dialog ref={dialogRef} className="modal" onClose={handleDialogClose}>
            <div className={`modal-box ${sizeClassName}`}>
                <h3 className="font-bold text-lg">{title}</h3>
                <div>
                    {children}
                </div>
                <div className="mt-2 text-center">
                    <div className="inline-flex gap-2">
                        <button
                            className="btn btn-primary mr-2 mt-0"
                            type="button"
                            tabIndex={1}
                            onClick={() => {
                                closeActionRef.current = 'yes';
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
                                    closeActionRef.current = 'no';
                                    dialogRef.current?.close();
                                }}>
                                {noLabel || "No"}
                            </button>)}
                    </div>
                </div>
            </div>
        </dialog>);
}