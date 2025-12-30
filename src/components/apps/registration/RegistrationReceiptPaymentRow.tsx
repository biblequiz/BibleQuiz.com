import FontAwesomeIcon from 'components/FontAwesomeIcon';
import { useEffect, useState } from 'react';

import type { PaymentEntry } from 'types/services/EventsService';
import { DataTypeHelpers } from 'utils/DataTypeHelpers';

interface Props {
    isEditable: boolean;
    entry: PaymentEntry;
    onChange: (balanceAdjustment: number) => void;
    onDelete: () => void;
}

export default function RegistrationReceiptPaymentRow({
    isEditable,
    entry,
    onChange,
    onDelete }: Props) {

    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [canSave, setCanSave] = useState<boolean>(false);
    const [date, setDate] = useState<string | undefined>(undefined);
    const [description, setDescription] = useState<string | undefined>(undefined);
    const [amount, setAmount] = useState<number>(0);

    useEffect(() => {
        setDate(DataTypeHelpers.formatDate(DataTypeHelpers.parseDateOnly(entry.EntryDate), "yyyy-MM-dd")!);
        setDescription(entry.Description);
        setAmount(entry.Amount);
        setCanSave(false);
    }, [entry]);

    useEffect(() => {
        if (!isEditable && isEditing) {
            setIsEditing(false);
            setCanSave(false);
        }
    }, [isEditable]);

    const canEdit = isEditable && !entry.IsAutomated;
    if (!isEditing || !canEdit) {

        let chargeLink = undefined;
        if (entry.IsAutomated) {
            const chargeIcon = <FontAwesomeIcon icon="fas faCreditCard" />;
            if (entry.AutomatedReceiptUrl) {
                chargeLink = (
                    <a href={entry.AutomatedReceiptUrl} target="_blank" className="text-sm ml-2">
                        {chargeIcon} Charge Receipt
                    </a>);
            }
            else {
                chargeLink = chargeIcon;
            }
        }

        return (
            <tr>
                <td className={`p-0 ${canEdit ? "pl-2 pt-2 pb-2" : "pl-10"}`}>
                    {canEdit && (
                        <button
                            type="button"
                            className="btn btn-sm btn-primary mr-1"
                            onClick={() => setIsEditing(true)}>
                            <FontAwesomeIcon icon="fas faEdit" />
                        </button>
                    )}
                    {DataTypeHelpers.formatDate(entry.EntryDate)}: {entry.Description}
                    {chargeLink}
                </td>
                <td className="text-right p-0 pr-4">
                    {DataTypeHelpers.formatDollars(-entry.Amount)}
                </td>
            </tr>
        )
    }

    const recalculateIfChanged = (
        latestDate: string | undefined,
        latestDescription: string | undefined,
        latestAmount: number) => {

        const anyMissingValues = !latestDate ||
            DataTypeHelpers.isNullOrEmpty(latestDescription?.trim()) ||
            latestAmount === undefined ||
            isNaN(latestAmount);
        const newCanSave = !anyMissingValues &&
            (entry.EntryDate !== latestDate ||
                entry.Description !== latestDescription ||
                entry.Amount !== latestAmount);

        setCanSave(newCanSave);
    }

    return (
        <tr>
            <td colSpan={2}>
                <div className="sm:grid sm:grid-cols-1 md:flex items-center gap-2 p-2 mt-0 mb-0">
                    <input
                        name="entryDate"
                        type="date"
                        className="input input-sm w-auto ml-2"
                        value={date}
                        onChange={e => {
                            const newDate = e.target.value;
                            setDate(newDate);
                            recalculateIfChanged(newDate, description, amount);
                        }}
                        required
                    />
                    <input
                        name="description"
                        type="text"
                        className="input input-sm min-w-24 ml-2 grow"
                        value={description}
                        maxLength={100}
                        onChange={e => {
                            const newDescription = e.target.value;
                            setDescription(newDescription);
                            recalculateIfChanged(date, newDescription, amount);
                        }}
                        required
                    />
                    <input
                        type="number"
                        step={0.01}
                        min={-10000}
                        max={10000}
                        className="input input-info input-sm mt-0 w-auto"
                        value={amount}
                        onChange={e => {
                            const newAmount = parseFloat(e.target.value);
                            setAmount(newAmount);
                            recalculateIfChanged(date, description, newAmount);
                        }}
                        required
                    />
                    <button
                        type="button"
                        className="btn btn-sm btn-success"
                        disabled={!canSave}
                        onClick={() => {
                            const adjustedAmount = entry.Amount - amount;
                            entry.EntryDate = date!;
                            entry.Description = description!;
                            entry.Amount = amount;

                            onChange(adjustedAmount);

                            setIsEditing(false);
                            setCanSave(false);
                        }}>
                        <FontAwesomeIcon icon="fas faCheck" />
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-error mt-0"
                        onClick={() => onDelete()}>
                        <FontAwesomeIcon icon="fas faTrash" />
                    </button>
                </div>
            </td>
        </tr>);
}