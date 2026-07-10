import { useEffect, useMemo, useRef, useState } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import ConfirmationDialog from "components/ConfirmationDialog";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import { sharedGlobalStatusToast } from "utils/SharedState";
import { Address } from "types/services/models/Address";
import {
    EventPayoutEntry,
    EventPayoutSummary,
    PayoutsService,
    SeasonPayoutSummary,
} from "types/services/PayoutsService";
import { AuthManager } from "types/AuthManager";
import { useModalDialog } from "hooks/useModalDialog";

interface EditingState {
    event: EventPayoutSummary;
    entry: EventPayoutEntry;
    isNew: boolean;
}

interface DeleteState {
    event: EventPayoutSummary;
    entry: EventPayoutEntry;
}

interface PayoutEntryDialogProps {
    event: EventPayoutSummary;
    entry: EventPayoutEntry;
    isNew: boolean;
    onSave: (entry: EventPayoutEntry) => Promise<void>;
    onCancel: () => void;
}

function formatDateForInput(value: string | null | undefined): string {
    const parsed = DataTypeHelpers.parseDateOnly(value ?? null);
    if (!parsed) {
        return DataTypeHelpers.formatDate(DataTypeHelpers.nowDateOnly, "yyyy-MM-dd") ?? "";
    }

    return DataTypeHelpers.formatDate(parsed, "yyyy-MM-dd") ?? "";
}

function formatDecimalForInput(value: number | null | undefined): string {
    return (value ?? 0).toString();
}

function defaultCurrentSeason(): number {
    const today = DataTypeHelpers.formatDate(DataTypeHelpers.nowDateOnly, "yyyy-MM-dd");
    const season = DataTypeHelpers.getSeasonFromDate(today ?? "");
    if (season !== null) {
        return season;
    }

    return DataTypeHelpers.nowDateOnly.getFullYear();
}

function createAddress(source: Address | null | undefined): Address {
    const address = new Address();
    address.StreetAddress = source?.StreetAddress ?? "";
    address.City = source?.City ?? "";
    address.State = source?.State ?? "";
    address.ZipCode = source?.ZipCode ?? null;
    return address;
}

function createEntryFromEvent(event: EventPayoutSummary): EventPayoutEntry {
    const entry = new EventPayoutEntry();
    entry.EntryDate = DataTypeHelpers.formatDate(DataTypeHelpers.nowDateOnly, "MM/dd/yyyy") ?? "";
    entry.Amount = event.UnpaidPayout ?? 0;
    entry.SiteFees = event.UnreconciledSiteFees ?? 0;
    entry.PayeeName = event.PayeeName ?? "";
    entry.PayeeEmail = event.PayeeEmail ?? "";
    entry.PayeeAddress = createAddress(event.PayeeAddress);
    entry.Notes = "";
    return entry;
}

function PayoutEntryDialog({
    event,
    entry,
    isNew,
    onSave,
    onCancel,
}: PayoutEntryDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    const [entryDate, setEntryDate] = useState<string>(formatDateForInput(entry.EntryDate));
    const [amount, setAmount] = useState<string>(formatDecimalForInput(entry.Amount));
    const [siteFees, setSiteFees] = useState<string>(formatDecimalForInput(entry.SiteFees));
    const [payeeName, setPayeeName] = useState<string>(entry.PayeeName ?? "");
    const [payeeEmail, setPayeeEmail] = useState<string>(entry.PayeeEmail ?? "");
    const [streetAddress, setStreetAddress] = useState<string>(entry.PayeeAddress?.StreetAddress ?? "");
    const [city, setCity] = useState<string>(entry.PayeeAddress?.City ?? "");
    const [state, setState] = useState<string>(entry.PayeeAddress?.State ?? "");
    const [zipCode, setZipCode] = useState<string>(DataTypeHelpers.formatZipCode(entry.PayeeAddress?.ZipCode ?? null));
    const [notes, setNotes] = useState<string>(entry.Notes ?? "");
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [showDiscardConfirmation, setShowDiscardConfirmation] = useState<boolean>(false);
    const initialValuesRef = useRef({
        entryDate: formatDateForInput(entry.EntryDate),
        amount: formatDecimalForInput(entry.Amount),
        siteFees: formatDecimalForInput(entry.SiteFees),
        payeeName: entry.PayeeName ?? "",
        payeeEmail: entry.PayeeEmail ?? "",
        streetAddress: entry.PayeeAddress?.StreetAddress ?? "",
        city: entry.PayeeAddress?.City ?? "",
        state: entry.PayeeAddress?.State ?? "",
        zipCode: DataTypeHelpers.formatZipCode(entry.PayeeAddress?.ZipCode ?? null),
        notes: entry.Notes ?? "",
    });

    const hasChanges = useMemo(() => {
        const initial = initialValuesRef.current;
        return entryDate !== initial.entryDate ||
            amount !== initial.amount ||
            siteFees !== initial.siteFees ||
            payeeName !== initial.payeeName ||
            payeeEmail !== initial.payeeEmail ||
            streetAddress !== initial.streetAddress ||
            city !== initial.city ||
            state !== initial.state ||
            zipCode !== initial.zipCode ||
            notes !== initial.notes;
    }, [amount, city, entryDate, notes, payeeEmail, payeeName, siteFees, state, streetAddress, zipCode]);

    function attemptCancel(): void {
        if (isSaving) {
            return;
        }

        if (hasChanges) {
            setShowDiscardConfirmation(true);
            return;
        }

        onCancel();
        dialogRef.current?.close();
    }

    useModalDialog(dialogRef, attemptCancel, isSaving || showDiscardConfirmation);

    const title = isNew ? `Add Payout: ${event.EventName}` : `Edit Payout: ${event.EventName}`;

    const canSave = useMemo(() => {
        return !isSaving &&
            !DataTypeHelpers.isNullOrEmpty(entryDate) &&
            !DataTypeHelpers.isNullOrEmpty(amount.trim()) &&
            !isNaN(parseFloat(amount)) &&
            !DataTypeHelpers.isNullOrEmpty(siteFees.trim()) &&
            !isNaN(parseFloat(siteFees)) &&
            !DataTypeHelpers.isNullOrEmpty(payeeName.trim()) &&
            !DataTypeHelpers.isNullOrEmpty(payeeEmail.trim()) &&
            !DataTypeHelpers.isNullOrEmpty(city.trim()) &&
            !DataTypeHelpers.isNullOrEmpty(zipCode.trim());
    }, [amount, city, entryDate, isSaving, payeeEmail, payeeName, siteFees, zipCode]);

    async function handleSave(eventArgs: React.FormEvent<HTMLFormElement>): Promise<void> {
        eventArgs.preventDefault();
        eventArgs.stopPropagation();

        if (!canSave) {
            return;
        }

        const parsedAmount = DataTypeHelpers.parseNullableFloat(amount);
        const parsedSiteFees = DataTypeHelpers.parseNullableFloat(siteFees);
        const parsedZipCode = DataTypeHelpers.parseNullableInt(zipCode);
        if (parsedAmount === null || parsedSiteFees === null || parsedZipCode === null) {
            sharedGlobalStatusToast.set({
                type: "error",
                title: "Unable to Save Payout Entry",
                message: "Please check amount, site fees, and zip code values.",
                timeout: 10000,
            });
            return;
        }

        const updated = new EventPayoutEntry();
        updated.Id = entry.Id;
        updated.EntryDate = entryDate;
        updated.Amount = parsedAmount;
        updated.SiteFees = parsedSiteFees;
        updated.PayeeName = payeeName.trim();
        updated.PayeeEmail = payeeEmail.trim();
        updated.PayeeAddress = new Address();
        updated.PayeeAddress.StreetAddress = streetAddress.trim();
        updated.PayeeAddress.City = city.trim();
        updated.PayeeAddress.State = state.trim();
        updated.PayeeAddress.ZipCode = parsedZipCode;
        updated.Notes = DataTypeHelpers.trimToNull(notes);

        setIsSaving(true);
        try {
            await onSave(updated);
            dialogRef.current?.close();
        }
        finally {
            setIsSaving(false);
        }
    }

    return (
        <dialog ref={dialogRef} className="modal">
            <div className="modal-box w-11/12 max-w-full md:w-4/5 lg:w-2/3">
                <h3 className="font-bold text-lg">{title}</h3>
                <form className="space-y-3" onSubmit={handleSave}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <label className="form-control">
                            <span className="label-text">Entry Date</span>
                            <input
                                type="date"
                                className="input input-sm input-bordered mt-0 mb-0"
                                value={entryDate}
                                onChange={e => setEntryDate(e.target.value)}
                                required
                            />
                        </label>
                        <label className="form-control">
                            <span className="label-text">Amount</span>
                            <input
                                type="number"
                                step="0.01"
                                className="input input-sm input-bordered mt-0 mb-0"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                required
                            />
                        </label>
                        <label className="form-control">
                            <span className="label-text">Site Fees</span>
                            <input
                                type="number"
                                step="0.01"
                                className="input input-sm input-bordered mt-0 mb-0"
                                value={siteFees}
                                onChange={e => setSiteFees(e.target.value)}
                                required
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <label className="form-control">
                            <span className="label-text">Payee Name</span>
                            <input
                                type="text"
                                className="input input-sm input-bordered mt-0 mb-0"
                                maxLength={100}
                                value={payeeName}
                                onChange={e => setPayeeName(e.target.value)}
                                required
                            />
                        </label>
                        <label className="form-control">
                            <span className="label-text">Payee Email</span>
                            <input
                                type="email"
                                className="input input-sm input-bordered mt-0 mb-0"
                                maxLength={150}
                                value={payeeEmail}
                                onChange={e => setPayeeEmail(e.target.value)}
                                required
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                        <label className="form-control md:col-span-6">
                            <span className="label-text">Street Address</span>
                            <input
                                type="text"
                                className="input input-sm input-bordered mt-0 mb-0"
                                value={streetAddress}
                                onChange={e => setStreetAddress(e.target.value)}
                            />
                        </label>
                        <label className="form-control md:col-span-3">
                            <span className="label-text">City</span>
                            <input
                                type="text"
                                className="input input-sm input-bordered mt-0 mb-0"
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                required
                            />
                        </label>
                        <label className="form-control md:col-span-1">
                            <span className="label-text">State</span>
                            <input
                                type="text"
                                className="input input-sm input-bordered mt-0 mb-0"
                                maxLength={2}
                                value={state}
                                onChange={e => setState(e.target.value.toUpperCase())}
                            />
                        </label>
                        <label className="form-control md:col-span-2">
                            <span className="label-text">Zip</span>
                            <input
                                type="text"
                                className="input input-sm input-bordered mt-0 mb-0"
                                pattern="[0-9]{5}"
                                maxLength={5}
                                value={zipCode}
                                onChange={e => setZipCode(e.target.value)}
                                required
                            />
                        </label>
                    </div>

                    <label className="form-control">
                        <span className="label-text">Notes</span>
                        <textarea
                            className="textarea textarea-sm textarea-bordered mt-0 mb-0"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={3}
                        />
                    </label>

                    <div className="modal-action">
                        <button type="submit" className="btn btn-primary btn-sm mt-0 mb-0" disabled={!canSave}>
                            <FontAwesomeIcon icon="fas faCheck" />
                            Save
                        </button>
                        <button
                            type="button"
                            className="btn btn-warning btn-sm mt-0 mb-0"
                            onClick={attemptCancel}
                            disabled={isSaving}
                        >
                            <FontAwesomeIcon icon="fas faMinusCircle" />
                            Cancel
                        </button>
                    </div>
                </form>
            </div>

            {showDiscardConfirmation && (
                <ConfirmationDialog
                    title="Discard Unsaved Changes?"
                    yesLabel="Discard"
                    onYes={() => {
                        setShowDiscardConfirmation(false);
                        onCancel();
                        dialogRef.current?.close();
                    }}
                    noLabel="Keep Editing"
                    onNo={() => setShowDiscardConfirmation(false)}
                >
                    <p>
                        You have unsaved changes on this payout entry. Discard these changes?
                    </p>
                </ConfirmationDialog>
            )}
        </dialog>
    );
}

export default function PayoutsPage() {
    const authManager = AuthManager.useNanoStore();
    const auth = authManager;

    const currentSeason = useMemo(() => defaultCurrentSeason(), []);
    const seasonOptions = useMemo(
        () => [currentSeason - 1, currentSeason, currentSeason + 1],
        [currentSeason],
    );

    const [selectedSeason, setSelectedSeason] = useState<number>(currentSeason);
    const [includeEventsWithoutRemainingPayout, setIncludeEventsWithoutRemainingPayout] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [loadingError, setLoadingError] = useState<string | null>(null);
    const [summary, setSummary] = useState<SeasonPayoutSummary | null>(null);
    const [editingState, setEditingState] = useState<EditingState | null>(null);
    const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
    const summaryCache = useRef<Record<number, SeasonPayoutSummary>>({});

    useEffect(() => {
        let isCanceled = false;

        const cachedSummary = summaryCache.current[selectedSeason];
        if (cachedSummary) {
            setSummary(cachedSummary);
            setLoadingError(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setLoadingError(null);

        PayoutsService.getSeasonSummary(auth, selectedSeason)
            .then(result => {
                if (isCanceled) {
                    return;
                }

                summaryCache.current[selectedSeason] = result;
                setSummary(result);
                setLoadingError(null);
            })
            .catch(error => {
                if (isCanceled) {
                    return;
                }

                const message = (error as Error)?.message || "An error occurred while loading payouts.";
                setLoadingError(message);
                sharedGlobalStatusToast.set({
                    type: "error",
                    title: "Unable to Load Payouts",
                    message,
                    timeout: 10000,
                });
            })
            .finally(() => {
                if (!isCanceled) {
                    setIsLoading(false);
                }
            });

        return () => {
            isCanceled = true;
        };
    }, [auth, selectedSeason]);

    const filteredEvents = useMemo(() => {
        const allEvents = summary?.Events ?? [];
        if (includeEventsWithoutRemainingPayout) {
            return allEvents;
        }

        return allEvents.filter(event => event.UnpaidPayout > 0);
    }, [includeEventsWithoutRemainingPayout, summary]);

    function refreshFromServerResult(updatedSummary: SeasonPayoutSummary): void {
        summaryCache.current[updatedSummary.Season] = updatedSummary;
        if (updatedSummary.Season === selectedSeason) {
            setSummary(updatedSummary);
        }
    }

    async function saveEntry(event: EventPayoutSummary, entry: EventPayoutEntry): Promise<void> {
        try {
            const updatedSummary = await PayoutsService.addOrUpdate(auth, selectedSeason, event.Id!, entry);
            refreshFromServerResult(updatedSummary);
            setEditingState(null);
            sharedGlobalStatusToast.set({
                type: "success",
                title: "Payout Entry Saved",
                message: "The payout entry was saved successfully.",
                timeout: 4000,
            });
        }
        catch (error) {
            sharedGlobalStatusToast.set({
                type: "error",
                title: "Unable to Save Payout Entry",
                message: (error as Error)?.message || "An error occurred while saving the payout entry.",
                timeout: 10000,
            });
            throw error;
        }
    }

    async function deleteEntry(event: EventPayoutSummary, entry: EventPayoutEntry): Promise<void> {
        try {
            const updatedSummary = await PayoutsService.delete(auth, selectedSeason, event.Id!, entry.Id!);
            refreshFromServerResult(updatedSummary);
            setDeleteState(null);
            sharedGlobalStatusToast.set({
                type: "success",
                title: "Payout Entry Deleted",
                message: "The payout entry was deleted successfully.",
                timeout: 4000,
            });
        }
        catch (error) {
            sharedGlobalStatusToast.set({
                type: "error",
                title: "Unable to Delete Payout Entry",
                message: (error as Error)?.message || "An error occurred while deleting the payout entry.",
                timeout: 10000,
            });
        }
    }

    async function downloadReport(): Promise<void> {
        setIsDownloading(true);
        try {
            await PayoutsService.downloadSeasonExcel(auth, selectedSeason);
        }
        catch (error) {
            sharedGlobalStatusToast.set({
                type: "error",
                title: "Unable to Download Report",
                message: (error as Error)?.message || "An error occurred while downloading the payout report.",
                timeout: 10000,
            });
        }
        finally {
            setIsDownloading(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
                <label className="form-control w-48">
                    <span className="label-text font-semibold">Season</span>
                    <select
                        className="select select-sm select-bordered mt-0 mb-0"
                        value={selectedSeason}
                        onChange={e => setSelectedSeason(parseInt(e.target.value))}
                    >
                        {seasonOptions.map(season => (
                            <option key={`season-${season}`} value={season}>{season} Season</option>
                        ))}
                    </select>
                </label>

                <label className="label mt-6 mb-0 cursor-pointer gap-2">
                    <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-info mt-0 mb-0"
                        checked={includeEventsWithoutRemainingPayout}
                        onChange={e => setIncludeEventsWithoutRemainingPayout(e.target.checked)}
                    />
                    <span className="label-text">Include events without remaining payout</span>
                </label>

                <button
                    type="button"
                    className="btn btn-primary btn-sm mt-6 mb-0"
                    onClick={downloadReport}
                    disabled={isDownloading || isLoading}
                >
                    <FontAwesomeIcon icon="far faFileExcel" />
                    {isDownloading ? "Downloading..." : "Download Report"}
                </button>
            </div>

            {!isLoading && !loadingError && summary && (
                <div className="stats stats-vertical md:stats-horizontal shadow w-full border border-base-300 bg-base-100">
                    <div className="stat py-3 px-4">
                        <div className="stat-title">Ready to Payout</div>
                        <div className="stat-value text-xl">{DataTypeHelpers.formatDollars(summary.UnpaidPayout)}</div>
                    </div>
                    <div className="stat py-3 px-4">
                        <div className="stat-title">Processing Fees</div>
                        <div className="stat-value text-xl">{DataTypeHelpers.formatDollars(summary.TotalProcessingFees)}</div>
                    </div>
                    <div className="stat py-3 px-4">
                        <div className="stat-title">BibleQuiz.com Fees</div>
                        <div className="stat-value text-xl">{DataTypeHelpers.formatDollars(summary.TotalSiteFees)}</div>
                    </div>
                </div>
            )}

            {isLoading && (
                <div className="flex items-center gap-2 py-6 justify-center">
                    <span className="loading loading-spinner loading-lg"></span>
                    <span>Loading payouts...</span>
                </div>
            )}

            {!isLoading && loadingError && (
                <div role="alert" className="alert alert-error">
                    <FontAwesomeIcon icon="fas faTriangleExclamation" />
                    <span>{loadingError}</span>
                </div>
            )}

            {!isLoading && !loadingError && summary && filteredEvents.length === 0 && (
                <div className="hero bg-base-200 rounded-2xl">
                    <div className="hero-content text-center py-10">
                        <div>
                            <h2 className="text-xl font-bold">No Events Match Your Filter</h2>
                            <p className="text-base-content/70 mt-2">
                                Try including events without remaining payout.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {!isLoading && !loadingError && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {filteredEvents.map(event => (
                        <div key={`event-${event.Id}`} className="card card-compact bg-base-100 border border-base-300 shadow-sm mt-0 mb-0">
                            <div className="card-body p-3">
                        <div className="flex flex-wrap gap-2 justify-between items-start">
                            <div>
                                <h2 className="card-title m-0">{event.EventName}</h2>
                                <div className="text-sm text-base-content/70 mt-1">
                                    Ends {DataTypeHelpers.formatDate(event.EventEndDate, "MMM d, yyyy")}
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                    <span className="badge badge-outline">Ready: {DataTypeHelpers.formatDollars(event.UnpaidPayout)}</span>
                                    <span className="badge badge-outline">Unreconciled Fees: {DataTypeHelpers.formatDollars(event.UnreconciledSiteFees)}</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn btn-primary btn-xs mt-0 mb-0"
                                onClick={() => setEditingState({
                                    event,
                                    entry: createEntryFromEvent(event),
                                    isNew: true,
                                })}
                            >
                                <FontAwesomeIcon icon="fas faPlus" />
                                Add Payout
                            </button>
                        </div>

                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                            {event.Entries?.map(entry => (
                                <div key={`entry-${entry.Id}`} className="card card-compact bg-base-200 border border-base-300 mt-0 mb-0">
                                    <div className="card-body p-2">
                                        <p className="m-0 text-sm font-semibold leading-tight">
                                            {DataTypeHelpers.formatDollars(entry.Amount)} paid to {entry.PayeeName}
                                        </p>
                                        <p className="m-0 text-xs text-base-content/70">
                                            {DataTypeHelpers.formatDate(entry.EntryDate, "MMM d, yyyy")}
                                        </p>
                                        {!DataTypeHelpers.isNullOrEmpty(entry.Notes ?? "") && (
                                            <p className="m-0 text-xs italic line-clamp-2">{entry.Notes}</p>
                                        )}
                                        <div className="mt-1 flex gap-1">
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-xs mt-0 mb-0"
                                                onClick={() => setEditingState({ event, entry, isNew: false })}
                                            >
                                                <FontAwesomeIcon icon="fas faPen" />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-error text-white btn-xs mt-0 mb-0"
                                                onClick={() => setDeleteState({ event, entry })}
                                            >
                                                <FontAwesomeIcon icon="fas faTrash" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {(event.Entries?.length ?? 0) === 0 && (
                                <p className="italic text-sm text-base-content/70">
                                    No payout entries recorded yet.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                    ))}
                </div>
            )}

            {editingState && (
                <PayoutEntryDialog
                    event={editingState.event}
                    entry={editingState.entry}
                    isNew={editingState.isNew}
                    onSave={(updatedEntry: EventPayoutEntry) => saveEntry(editingState.event, updatedEntry)}
                    onCancel={() => setEditingState(null)}
                />
            )}

            {deleteState && (
                <ConfirmationDialog
                    title="Confirm Deletion"
                    yesLabel="Delete"
                    onYes={() => deleteEntry(deleteState.event, deleteState.entry)}
                    noLabel="Cancel"
                    onNo={() => setDeleteState(null)}
                >
                    <p>
                        Deleting this payout entry cannot be undone. Continue?
                    </p>
                </ConfirmationDialog>
            )}
        </div>
    );
}
