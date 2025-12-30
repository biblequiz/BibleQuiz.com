import { useState } from 'react';

import { PaymentEntry, type EventChurchSummary, type EventSummary } from 'types/services/EventsService';
import RegistrationReceiptPaymentRow from './RegistrationReceiptPaymentRow';
import { sharedDirtyWindowState } from 'utils/SharedState';
import { DataTypeHelpers } from 'utils/DataTypeHelpers';
import FontAwesomeIcon from 'components/FontAwesomeIcon';

interface Props {
    eventSummary: EventSummary;
    churchSummary: EventChurchSummary;
    isEditable: boolean;
    includeDetails: boolean;
    setAreEntriesChanged: (hasChanges: boolean) => void;
}

export default function RegistrationReceipt({
    eventSummary,
    churchSummary,
    isEditable,
    includeDetails,
    setAreEntriesChanged }: Props) {

    const [entries, setEntries] = useState<PaymentEntry[]>(() => churchSummary?.PaymentEntries || []);
    const [paymentsTotal, setPaymentsTotal] = useState<number>(() => {
        let total = 0;
        if (churchSummary?.PaymentEntries) {
            for (const entry of entries) {
                total += entry.Amount;
            }
        }

        return total;
    });

    return (
        <div className="overflow-x-auto">
            <button
                type="button"
                className="btn btn-sm btn-primary float-right mb-4"
                onClick={() => {
                    setEntries([
                        ...entries,
                        {
                            Id: null,
                            EntryDate: DataTypeHelpers.formatDate(DataTypeHelpers.nowDateOnly, "yyyy-MM-dd"),
                            Description: "",
                            Amount: 0,
                            IsAutomated: false
                        } as PaymentEntry]);

                    setAreEntriesChanged(true);
                    sharedDirtyWindowState.set(true);
                }}>
                <FontAwesomeIcon icon="fas faPlus" /> Add Payment
            </button>
            <table className="table table-zebra">
                <thead>
                    <tr>
                        <th className="p-0 pl-4">Item</th>
                        <th className="text-right p-0 pr-4">Cost</th>
                    </tr>
                </thead>
                <tbody>
                    {eventSummary.HasPaymentBalance && (
                        <>
                            <tr>
                                <td className="font-bold uppercase p-0 pl-4" colSpan={2}>Payments & Fees</td>
                            </tr>
                            {entries.length === 0 && (
                                <tr>
                                    <td className="text-center italic" colSpan={2}>No payment entries found.</td>
                                </tr>
                            )}
                            {entries.map((entry, index) => (
                                <RegistrationReceiptPaymentRow
                                    key={`payment-editable-${entry.Id || -index}`}
                                    isEditable={isEditable}
                                    entry={entry}
                                    onChange={balanceAdjustment => {
                                        setPaymentsTotal(paymentsTotal - balanceAdjustment);
                                        setAreEntriesChanged(true);
                                        sharedDirtyWindowState.set(true);
                                    }}
                                    onDelete={() => {
                                        setEntries(entries.filter(e => e !== entry));
                                        setAreEntriesChanged(true);
                                        sharedDirtyWindowState.set(true);
                                    }}
                                />))}
                            {entries.length > 0 && (
                                <tr>
                                    <td className="font-bold italic uppercase p-0 pl-10">Subtotal for Payments & Fees</td>
                                    <td className="text-right p-0 pr-4">{DataTypeHelpers.formatDollars(-paymentsTotal)}</td>
                                </tr>
                            )}
                        </>
                    )}
                </tbody>
                <tfoot>
                    <tr>
                        <td className="p-0 pl-4">TOTAL CHURCH REGISTRATION COST</td>
                        <td className="text-right p-0 pr-4">$0.00</td>
                    </tr>
                </tfoot>
            </table>
        </div>);
}