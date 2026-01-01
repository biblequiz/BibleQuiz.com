import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useRef, useState } from "react";
import type { PaymentEntry } from "types/services/EventsService";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

export interface AddingChurchState {
}

interface Props {
    entry: PaymentEntry;
    onClose: (entry: PaymentEntry | undefined) => void;
    onDelete: () => void;
}

export default function EventPaymentsEntryDialog({
    entry,
    onClose,
    onDelete }: Props) {

    const dialogRef = useRef<HTMLDialogElement>(null);

    const [canSave, setCanSave] = useState<boolean>(false);
    const [date, setDate] = useState<string | undefined>(() => DataTypeHelpers.formatDate(DataTypeHelpers.parseDateOnly(entry.EntryDate), "yyyy-MM-dd")!);
    const [description, setDescription] = useState<string | undefined>(entry.Description);
    const [amount, setAmount] = useState<number>(entry.Amount);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        event.stopPropagation();

        entry.EntryDate = date!;
        entry.Description = description!;
        entry.Amount = amount;

        onClose(entry);

        dialogRef.current?.close();
    };

    const recalculateIfChanged = (
        latestDate: string | undefined,
        latestDescription: string | undefined,
        latestAmount: number) => {

        const anyMissingValues = !latestDate ||
            DataTypeHelpers.isNullOrEmpty(latestDescription?.trim()) ||
            latestAmount === undefined ||
            isNaN(latestAmount);
        const newCanSave = !anyMissingValues &&
            (entry.Description !== latestDescription ||
                entry.Amount !== latestAmount ||
                DataTypeHelpers.formatDate(DataTypeHelpers.parseDateOnly(entry.EntryDate), "yyyy-MM-dd")! !== latestDate);

        setCanSave(newCanSave);
    }

    return (
        <dialog ref={dialogRef} className="modal" open>
            <div className="modal-box w-11/12 max-w-full md:w-1/2">
                <h3 className="font-bold text-lg">Edit Payment Entry</h3>
                <form method="dialog gap-2" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-[minmax(auto,150px)_1fr] gap-x-4 gap-y-2 items-center">
                        <label className="label justify-start p-0">
                            <span className="label-text font-medium">Date</span>
                            <span className="label-text-alt text-error ml-1">*</span>
                        </label>
                        <input
                            name="entryDate"
                            type="date"
                            className="input input-sm"
                            value={date}
                            onChange={e => {
                                const newDate = e.target.value;
                                setDate(newDate);
                                recalculateIfChanged(newDate, description, amount);
                            }}
                            required
                        />

                        <label className="label justify-start p-0">
                            <span className="label-text font-medium">Description</span>
                            <span className="label-text-alt text-error ml-1">*</span>
                        </label>
                        <input
                            name="description"
                            type="text"
                            className="input input-sm"
                            value={description}
                            maxLength={100}
                            onChange={e => {
                                const newDescription = e.target.value;
                                setDescription(newDescription);
                                recalculateIfChanged(date, newDescription, amount);
                            }}
                            required
                        />

                        <label className="label justify-start p-0 mt-0">
                            <span className="label-text font-medium">Amount</span>
                            <span className="label-text-alt text-error ml-1">*</span>
                        </label>
                        <label className="input input-sm mt-0">
                            <FontAwesomeIcon icon="fas faDollarSign" />
                            <input
                                type="number"
                                step={0.01}
                                min={-10000}
                                max={10000}
                                className="grow"
                                value={amount}
                                onChange={e => {
                                    const newAmount = parseFloat(e.target.value);
                                    setAmount(newAmount);
                                    recalculateIfChanged(date, description, newAmount);
                                }}
                                required
                            />
                        </label>
                    </div>
                    <div className="mt-4 text-right">
                        <button
                            className="btn btn-primary mr-2 mt-0 btn-sm"
                            type="submit"
                            tabIndex={1}
                            disabled={!canSave}>
                            <FontAwesomeIcon icon="fas faCheck" />
                            Apply
                        </button>
                        <button
                            className="btn btn-error mr-2 mt-0 btn-sm"
                            type="button"
                            tabIndex={2}
                            onClick={() => {
                                onDelete();
                                dialogRef.current?.close();
                            }}>
                            <FontAwesomeIcon icon="fas faTrash" />
                            Remove Entry
                        </button>
                        <button
                            className="btn btn-warning mt-0 btn-sm"
                            type="button"
                            tabIndex={3}
                            onClick={() => {
                                onClose(undefined);
                                dialogRef.current?.close();
                            }}>
                            <FontAwesomeIcon icon="fas faMinusCircle" />
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </dialog>);
}