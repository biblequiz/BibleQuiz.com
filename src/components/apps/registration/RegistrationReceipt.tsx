import { PaymentEntry, type EventChurchSummary, type EventSummary } from 'types/services/EventsService';
import RegistrationReceiptPaymentRow from './RegistrationReceiptPaymentRow';
import { DataTypeHelpers } from 'utils/DataTypeHelpers';

interface Props {
    eventSummary: EventSummary;
    churchSummary: EventChurchSummary;
    entries: PaymentEntry[];
    isEditable: boolean;
    includeDetails: boolean;
    editEntry: (entry: PaymentEntry) => void;
}

export default function RegistrationReceipt({
    eventSummary,
    churchSummary,
    entries,
    isEditable,
    includeDetails,
    editEntry }: Props) {

    let paymentsTotal = 0;
    for (const entry of entries) {
        paymentsTotal += entry.Amount;
    }

    return (
        <div className="overflow-x-auto">
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
                                    onEdit={() => editEntry(entry)}
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