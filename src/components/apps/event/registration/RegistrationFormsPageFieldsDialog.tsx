import FontAwesomeIcon from "components/FontAwesomeIcon";

interface Props {
    dialogRef: React.RefObject<HTMLDialogElement | null>;
    missingForRoles: string[];
    setDialogResult: (result: boolean) => void;
}

export default function RegistrationFormsPageFieldsDialog({
    dialogRef,
    missingForRoles,
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
                            One or more Waivers require Birthdates, but the following roles don't currently
                            require a Birthdate:
                        </p>
                        <ul>
                            {missingForRoles.map(role => (
                                <li key={`role_${role}`}>{role}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="modal-action">
                        <button
                            className="btn btn-primary mr-2 mt-0"
                            tabIndex={1}>
                            <FontAwesomeIcon icon="fas faCheck" />
                            Mark as Required
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