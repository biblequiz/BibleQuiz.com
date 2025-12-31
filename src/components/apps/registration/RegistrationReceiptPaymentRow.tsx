import FontAwesomeIcon from 'components/FontAwesomeIcon';

import type { PaymentEntry } from 'types/services/EventsService';
import { DataTypeHelpers } from 'utils/DataTypeHelpers';

interface Props {
    isEditable: boolean;
    entry: PaymentEntry;
    isEditDisabled: boolean;
    onEdit: () => void;
}

export default function RegistrationReceiptPaymentRow({
    isEditable,
    entry,
    isEditDisabled,
    onEdit }: Props) {

    const canEdit = isEditable && !entry.IsAutomated;
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
                        disabled={isEditDisabled}
                        onClick={() => onEdit()}>
                        <FontAwesomeIcon icon="fas faEdit" />
                    </button>
                )}
                {DataTypeHelpers.formatDate(entry.EntryDate)}: {entry.Description}
                {chargeLink}
            </td>
            <td className="text-right p-0 pr-4">
                {DataTypeHelpers.formatDollars(-entry.Amount)}
            </td>
        </tr>);
}