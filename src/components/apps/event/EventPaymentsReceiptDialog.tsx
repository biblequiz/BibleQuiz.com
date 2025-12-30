import { useRef, useState } from 'react';

import type { EventChurchSummary, EventSummary } from 'types/services/EventsService';
import RegistrationReceipt from '../registration/RegistrationReceipt';
import FontAwesomeIcon from 'components/FontAwesomeIcon';

interface Props {
    eventSummary: EventSummary;
    churchSummary: EventChurchSummary;
    onClose(): void;
}

export default function EventPaymentsReceiptDialog({
    eventSummary,
    churchSummary,
    onClose }: Props) {

    const dialogRef = useRef<HTMLDialogElement>(null);

    const [areEntriesChanged, setAreEntriesChanged] = useState<boolean>(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
        // TODO: Add dirty page handling.
        dialogRef.current?.close();
        onClose();
    };

    return (
        <dialog ref={dialogRef} className="modal" open>
            <div className="modal-box w-11/12 max-w-full md:w-3/4 lg:w-1/2">
                <h3 className="font-bold text-lg">
                    Receipt for {churchSummary.ChurchName}
                </h3>
                <form method="dialog gap-2" onSubmit={handleSubmit}>
                    <RegistrationReceipt
                        eventSummary={eventSummary}
                        churchSummary={churchSummary}
                        isEditable={true}
                        includeDetails={false}
                        setAreEntriesChanged={setAreEntriesChanged} />
                    <div className="mt-4 text-right">
                        {areEntriesChanged && (
                            <button
                                className="btn btn-success mr-2 mt-0"
                                tabIndex={1}
                                onClick={() => {
                                    dialogRef.current?.close();
                                    onClose();
                                }}>
                                <FontAwesomeIcon icon="fas faSave" />
                                Save
                            </button>)}
                        <button
                            className="btn btn-warning mr-2 mt-0"
                            tabIndex={2}
                            onClick={() => {
                                dialogRef.current?.close();
                                onClose();
                            }}>
                            Close
                        </button>
                    </div>
                </form>
            </div>
        </dialog>);
}