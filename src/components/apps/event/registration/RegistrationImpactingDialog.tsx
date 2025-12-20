import FontAwesomeIcon from "components/FontAwesomeIcon";

interface Props {
    dialogRef: React.RefObject<HTMLDialogElement | null>;
    changes: string[];
    setDialogResult: (result: boolean) => void;
}

export default function RegistrationImpactingDialog({
    dialogRef,
    changes,
    setDialogResult }: Props) {

    return (
        <dialog ref={dialogRef} className="modal modal-open">
            <form method="dialog" onSubmit={() => setDialogResult(true)}>
                <div className="modal-box w-full max-w-3xl">
                    <button
                        className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    >✕</button
                    >
                    <div>
                        <p>
                            Teams have already registered and <i>may</i> be impacted by the
                            following changes you are making:
                        </p>
                        <ul>
                            {changes.map((change, index) => (
                                <li 
                                    key={`change_${index}`}
                                    dangerouslySetInnerHTML={{ __html: change }}
                                ></li>
                            ))}
                        </ul>
                    </div>
                    <div className="modal-action">
                        <button
                            className="btn btn-primary mr-2 mt-0"
                            tabIndex={1}>
                            <FontAwesomeIcon icon="fas faCheck" />
                            Save Anyway
                        </button>
                        <button
                            className="btn btn-error mr-2 mt-0"
                            type="button"
                            tabIndex={1}
                            onClick={() => setDialogResult(false)}>
                            <FontAwesomeIcon icon="fas faMinusCircle" />
                            Cancel
                        </button>
                    </div>
                </div>
            </form>
        </dialog>);
}