import { useEffect, useState } from 'react';

import { EventsService, type EventChurchSummary, type EventSummary, type PaymentEntry } from 'types/services/EventsService';
import RegistrationReceipt from '../registration/RegistrationReceipt';
import FontAwesomeIcon from 'components/FontAwesomeIcon';
import type { EventSummaryProviderContext } from './EventSummaryProvider';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { DataTypeHelpers } from 'utils/DataTypeHelpers';
import EventPaymentsEntryDialog from './EventPaymentsEntryDialog';
import { sharedDirtyWindowState } from 'utils/SharedState';
import { RegistrationService } from 'types/services/RegistrationService';

interface Props {
}

const getChurchFromSummary = (
    summary: EventSummary,
    id: string): EventChurchSummary | undefined => {

    if (!summary?.Churches) {
        return undefined;
    }

    for (const church of summary.Churches) {
        if (church.Id === id) {
            return church;
        }
    }

    return undefined;
}

export default function EventPaymentsReceiptPage({ }: Props) {

    const {
        context,
        summary
    } = useOutletContext<EventSummaryProviderContext>();

    const urlParameters = useParams();
    const navigate = useNavigate();

    const churchId = urlParameters.churchId!;

    const [churchSummary, setChurchSummary] = useState(() => getChurchFromSummary(summary, churchId));
    const [entries, setEntries] = useState<PaymentEntry[]>(churchSummary?.PaymentEntries || []);
    const [areEntriesChanged, setAreEntriesChanged] = useState<boolean>(false);
    const [editingEntry, setEditingEntry] = useState<PaymentEntry | undefined>();
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (!churchSummary || churchSummary.Id !== churchId) {
            const newChurchSummary = getChurchFromSummary(summary, churchId);
            setChurchSummary(newChurchSummary);
            setEntries(newChurchSummary?.PaymentEntries || []);
        }
    }, [churchId]);

    const backButton =
        <button
            type="button"
            className="btn btn-sm btn-primary mr-2 hide-on-print mb-4"
            onClick={() => navigate(`${context.rootUrl}/summary/payments`)}>
            <FontAwesomeIcon icon="fas faArrowLeft" />
            Back to All Churches
        </button>;

    if (!churchSummary) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <FontAwesomeIcon icon="fas faSackDollar" />
                            <span className="ml-4">No Fees or Payments</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            This church doesn't have any fees or payments associated with it.
                        </p>
                        {backButton}
                    </div>
                </div>
            </div>);
    }
    else if (isSaving) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">Saving Payment Entries ...</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            Saving your changes to the payment entries. This should just take a second or two ...
                        </p>
                    </div>
                </div>
            </div>);
    }

    return (
        <div>
            {error && (
                <div className="alert alert-warning rounded-2xl mb-4">
                    <div
                        className="w-full"
                        dangerouslySetInnerHTML={{ __html: error }} />
                </div>)}
            {backButton}
            <p className="mt-0">
                <span className="font-bold">Location:</span> {summary.LocationName}<br />
                <span className="font-bold">Dates:</span> {DataTypeHelpers.formatDateRange(summary.StartDate, summary.EndDate)}<br />
                <span className="font-bold">Last Updated:</span> {DataTypeHelpers.formatDate(
                    churchSummary ? churchSummary.LastModified : summary.RefreshDate,
                    "MMMM d, yyyy")}
            </p>
            <div className="divider" />
            <RegistrationReceipt
                eventSummary={summary}
                churchSummary={churchSummary}
                entries={entries}
                isEditable={true}
                includeDetails={false}
                editEntry={e => setEditingEntry(e)} />
            <div className="mt-4 text-right hide-on-print">
                <button
                    type="button"
                    className="btn btn-warning mr-2 mt-0"
                    tabIndex={1}
                    onClick={() => window.print()}>
                    <FontAwesomeIcon icon="fas faPrint" />
                    Print
                </button>
                <button
                    type="button"
                    className="btn btn-primary mr-2 mt-0"
                    tabIndex={2}
                    disabled={isSaving}
                    onClick={() => {
                        setEditingEntry({
                            Id: null,
                            EntryDate: DataTypeHelpers.formatDate(DataTypeHelpers.nowDateOnly, "yyyy-MM-dd")!,
                            Description: "",
                            Amount: 0,
                            IsAutomated: false
                        } as PaymentEntry);
                    }}>
                    <FontAwesomeIcon icon="fas faPlus" />
                    Add Payment Entry
                </button>
                <button
                    type="button"
                    className="btn btn-success mr-2 mt-0"
                    tabIndex={3}
                    disabled={!areEntriesChanged || isSaving}
                    onClick={() => {
                        setIsSaving(true);
                        RegistrationService.updateChurchBalanceEntries(
                            context.auth,
                            context.eventId,
                            churchId,
                            entries)
                            .then(refresh => {
                                if (refresh) {
                                    EventsService.getEventSummary(
                                        context.auth,
                                        context.eventId,
                                        churchId)
                                        .then(updatedSummary => {
                                            if (updatedSummary.Churches) {
                                                const existingChurchIndex = summary.Churches.findIndex(c => c.Id === churchId);
                                                const updatedChurch = getChurchFromSummary(updatedSummary, churchId);
                                                if (existingChurchIndex >= 0 && updatedChurch) {
                                                    summary.Churches[existingChurchIndex] = updatedChurch;
                                                }

                                                setChurchSummary(updatedChurch);
                                                setEntries(updatedChurch?.PaymentEntries || []);
                                            }
                                            else {
                                                setEntries([]);
                                            }

                                            setIsSaving(false);
                                            setAreEntriesChanged(false);
                                            setError(undefined);
                                            sharedDirtyWindowState.set(false);
                                        })
                                        .catch(err => {
                                            setError(err.message ?? "An error occurred while refreshing the event summary.");
                                            setIsSaving(false);
                                        });
                                }
                                else {
                                    setIsSaving(false);
                                    setAreEntriesChanged(false);
                                    setError(undefined);
                                }
                            })
                            .catch(err => {
                                setIsSaving(false);
                                setError(err.message ?? "An error occurred while saving the payment entries.");
                            });
                    }}>
                    <FontAwesomeIcon icon="fas faSave" />
                    Save Changes
                </button>
            </div>
            {
                editingEntry && (
                    <EventPaymentsEntryDialog
                        entry={editingEntry}
                        onClose={entry => {
                            if (entry) {
                                const existingIndex = entries.findIndex(e => e === editingEntry);
                                if (existingIndex >= 0) {
                                    const newEntries = [...entries];
                                    newEntries[existingIndex] = entry;
                                    setEntries(newEntries);
                                }
                                else {
                                    setEntries([...entries, entry]);
                                }

                                setAreEntriesChanged(true);

                                sharedDirtyWindowState.set(true);
                            }

                            setEditingEntry(undefined);
                        }}
                        onDelete={() => {
                            const newEntries = entries.filter(e => e !== editingEntry);
                            setEntries(newEntries);
                            setAreEntriesChanged(true);
                            setEditingEntry(undefined);

                            sharedDirtyWindowState.set(true);
                        }}
                    />)
            }
        </div >);
}