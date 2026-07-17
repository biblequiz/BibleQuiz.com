import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { RegistrationProviderContext } from "./RegistrationProvider";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import CollapsibleSection from "components/CollapsibleSection";
import ChurchLookup, { ChurchSearchTips } from "components/ChurchLookup";
import PersonCardDeck from "./PersonCardDeck";
import RegistrationBanner from "./RegistrationBanner";
import RegistrationSaveBar from "./RegistrationSaveBar";
import RegistrationTeamDialog from "./RegistrationTeamDialog";
import { PersonRole } from "types/services/PeopleService";
import { EventFieldScopes, EventsService, type PaymentEntry } from "types/services/EventsService";
import { RegistrationService, type RegistrationPerson, type RegistrationOfficial, type RegistrationTeam } from "types/services/RegistrationService";
import RegistrationPersonDialog from "./RegistrationPersonDialog";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import type { Church } from "types/services/ChurchesService";
import EmailForm from "components/apps/event/EmailForm";
import { EmailRecipientType } from "types/services/EmailService";
import { useEscapeToClose } from "hooks/useEscapeToClose";
import ChurchSettingsDialog, { type AddingChurchState } from "components/ChurchSettingsDialog";
import EventPaymentsEntryDialog from "components/apps/event/EventPaymentsEntryDialog";

const PAGE_ID = "registration";

export default function RegistrationPage() {
    const context = useOutletContext<RegistrationProviderContext>();
    const {
        auth,
        eventId,
        event,
        isEventOwner,
        church,
        setChurch,
        userChurches,
        addUserChurch,
        isLoadingUserChurches,
        registration,
        setRegistration,
        registrationVersion,
        setRegistrationVersion,
        reloadRegistration,
        isEditable,
        sectionEditability,
        churchPermissionError,
        isDirty,
        setDirty,
        isSaving,
        saveRegistration,
    } = context;

    const [showChurchSearch, setShowChurchSearch] = useState(false);
    const [editingTeam, setEditingTeam] = useState<RegistrationTeam | null>(null);
    const [isAddingTeam, setIsAddingTeam] = useState(false);
    const [editingPerson, setEditingPerson] = useState<{ person: RegistrationPerson | null; role: PersonRole } | null>(null);
    const [descriptionExpanded, setDescriptionExpanded] = useState(false);
    const [showEmailDialog, setShowEmailDialog] = useState(false);
    const [addingChurchState, setAddingChurchState] = useState<AddingChurchState | null>(null);

    // Payment entry management state (for event owners only)
    const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([]);
    const [paymentEntriesLoaded, setPaymentEntriesLoaded] = useState(false);
    const [editingPaymentEntry, setEditingPaymentEntry] = useState<PaymentEntry | null>(null);
    const [isSavingPaymentEntries, setIsSavingPaymentEntries] = useState(false);
    const [paymentEntriesError, setPaymentEntriesError] = useState<string | null>(null);
    const [paymentEntriesDirty, setPaymentEntriesDirty] = useState(false);

    // Load payment entries for event owners
    useEffect(() => {
        if (isEventOwner && event?.TrackPayments && church?.Id && !paymentEntriesLoaded) {
            EventsService.getEventSummary(auth, eventId, church.Id)
                .then(summary => {
                    const churchSummary = summary.Churches?.find(c => c.Id === church.Id);
                    setPaymentEntries(churchSummary?.PaymentEntries ?? []);
                    setPaymentEntriesLoaded(true);
                })
                .catch(err => {
                    setPaymentEntriesError(err instanceof Error ? err.message : "Failed to load payment entries");
                    setPaymentEntriesLoaded(true);
                });
        }
    }, [isEventOwner, event?.TrackPayments, church?.Id, paymentEntriesLoaded, auth, eventId, church]);

    // Church location helper.
    const formatChurchLocation = (c: Church): string | null => {
        const city = c.PhysicalAddress?.City;
        const state = c.PhysicalAddress?.State;
        if (DataTypeHelpers.isNullOrEmpty(city) && DataTypeHelpers.isNullOrEmpty(state)) return null;
        if (DataTypeHelpers.isNullOrEmpty(city)) return state;
        if (DataTypeHelpers.isNullOrEmpty(state)) return city;
        return `${city}, ${state}`;
    };

    // Section badges.
    const teamCount = registration?.Teams?.length ?? 0;
    const officialCount = registration?.Officials?.length ?? 0;
    const individualCount = registration?.Individuals?.length ?? 0;
    const attendeeCount = registration?.Attendees?.length ?? 0;
    const formTotal = registration?.Forms?.length ?? 0;
    const formCompleted = registration?.Forms?.filter(f => f.CompletedDate !== null).length ?? 0;

    // People edit handlers.
    const handlePersonDialogClose = (updatedPerson: RegistrationPerson | null, role: PersonRole) => {
        setEditingPerson(null);
        if (!updatedPerson || !registration) return;

        const updateList = <T extends RegistrationPerson>(list: T[], person: T): T[] => {
            const existing = list.findIndex(p => p.PersonId === person.PersonId);
            if (existing >= 0) {
                const copy = [...list];
                copy[existing] = person;
                return copy;
            }
            return [...list, person];
        };

        const updated = { ...registration } as typeof registration;
        switch (role) {
            case PersonRole.Official:
                updated.Officials = updateList(updated.Officials ?? [], updatedPerson as RegistrationOfficial);
                break;
            case PersonRole.QuizzerWithoutTeam:
                updated.Individuals = updateList(updated.Individuals ?? [], updatedPerson);
                break;
            case PersonRole.Attendee:
                updated.Attendees = updateList(updated.Attendees ?? [], updatedPerson);
                break;
        }

        setRegistration(updated);
        setDirty(true);
    };

    const handleRemovePerson = (person: RegistrationPerson, role: PersonRole) => {
        if (!registration) return;

        const updated = { ...registration } as typeof registration;
        switch (role) {
            case PersonRole.Official:
                updated.Officials = (updated.Officials ?? []).filter(p => p.PersonId !== person.PersonId);
                break;
            case PersonRole.QuizzerWithoutTeam:
                updated.Individuals = (updated.Individuals ?? []).filter(p => p.PersonId !== person.PersonId);
                break;
            case PersonRole.Attendee:
                updated.Attendees = (updated.Attendees ?? []).filter(p => p.PersonId !== person.PersonId);
                break;
        }

        setRegistration(updated);
        setDirty(true);
    };

    return (
        <div className="flex flex-col gap-2 pb-16">
            {/* Banner */}
            {!isEventOwner && <RegistrationBanner event={event} />}

            <fieldset disabled={isSaving} className="contents">

                {/* Event Summary */}
                <div className="bg-base-100 border border-base-300 rounded-lg p-3">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                        <div className="min-w-0">
                            <h2 className="text-xl font-bold m-0">{event.Name}</h2>
                            {event.Subtitle && <p className="text-sm italic m-0">{event.Subtitle}</p>}
                            <p className="text-sm text-base-content/70 m-0">
                                {DataTypeHelpers.formatDate(event.StartDate)}
                                {event.EndDate && event.EndDate !== event.StartDate && ` - ${DataTypeHelpers.formatDate(event.EndDate)}`}
                                {event.LocationName && ` · ${event.LocationName}`}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 shrink-0">
                            <button
                                type="button"
                                className="btn btn-sm btn-outline m-0"
                                onClick={() => setShowEmailDialog(true)}
                            >
                                <FontAwesomeIcon icon="fas faEnvelope" classNames={["mr-1"]} />
                                Email Coordinator
                            </button>
                            {isEditable && sectionEditability.teams && church && (
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline m-0"
                                    onClick={() => alert("Clone Teams is not yet implemented.")}
                                >
                                    <FontAwesomeIcon icon="fas faCopy" classNames={["mr-1"]} />
                                    Clone Teams
                                </button>
                            )}
                            {isEventOwner && (
                                <a
                                    href={`/manage-events/event/#/${eventId}/dashboard`}
                                    className="btn btn-sm btn-outline m-0"
                                >
                                    <FontAwesomeIcon icon="fas faPenToSquare" classNames={["mr-1"]} />
                                    Edit Event
                                </a>
                            )}
                        </div>
                    </div>
                    {event.Description && (
                        <div className="mt-1">
                            <div
                                className={`text-sm prose prose-sm max-w-none overflow-hidden ${!descriptionExpanded ? "max-h-30" : ""}`}
                                dangerouslySetInnerHTML={{ __html: event.Description }}
                            />
                            <button
                                type="button"
                                className="btn btn-primary btn-xs m-0 mt-1"
                                onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                            >
                                {descriptionExpanded ? "Show less" : "Show more description"}
                            </button>
                        </div>
                    )}
                </div>

                {/* Church Section */}
                <CollapsibleSection
                    pageId={PAGE_ID}
                    elementId="church"
                    icon="fas faChurch"
                    title="Church"
                    defaultOpen={!church}
                    forceOpen={!church}
                    badges={church
                        ? [{ className: "badge-lg badge-soft badge-success", icon: "fas faCheck", text: church.Name }]
                        : [{ className: "badge-lg badge-soft badge-warning", icon: "fas faTriangleExclamation", text: "Church required" }]}
                    addTopPadding={true}
                >
                    {/* Permission error */}
                    {churchPermissionError && (
                        <div role="alert" className="alert alert-error mb-2">
                            <FontAwesomeIcon icon="fas faCircleExclamation" />
                            <span>{churchPermissionError}</span>
                        </div>
                    )}

                    {/* No church selected prompt */}
                    {!church && (
                        <div role="alert" className="alert alert-warning mb-2">
                            <FontAwesomeIcon icon="fas faChurch" />
                            <div>
                                <div className="text-md font-bold mt-0 mb-0">
                                    Choose one of your churches below or search for a different church to get started.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick-select cards */}
                    {!isLoadingUserChurches && userChurches.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {userChurches.map(c => {
                                const isSelected = church?.Id === c.Id;
                                const location = formatChurchLocation(c);
                                return (
                                    <button
                                        key={`church-${c.Id}`}
                                        type="button"
                                        className={`btn btn-sm m-0 ${isSelected ? "btn-primary" : "btn-outline"}`}
                                        onClick={() => setChurch(c)}
                                    >
                                        <FontAwesomeIcon icon="fas faChurch" classNames={["mr-1"]} />
                                        {c.Name}
                                        {location && <span className="text-xs ml-1 opacity-70">({location})</span>}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {isLoadingUserChurches && (
                        <div className="flex items-center gap-2 mb-2">
                            <span className="loading loading-spinner loading-sm"></span>
                            <span className="text-sm">Loading your churches...</span>
                        </div>
                    )}

                    {/* Register with a different church */}
                    {!showChurchSearch && (
                        <button
                            type="button"
                            className="btn btn-ghost btn-xs m-0"
                            onClick={() => setShowChurchSearch(true)}
                        >
                            <FontAwesomeIcon icon="fas faMagnifyingGlass" classNames={["mr-1"]} />
                            Register with a different church
                        </button>
                    )}

                    {showChurchSearch && (
                        <div className="mt-2 p-2 border border-base-300 rounded-lg">
                            <ChurchLookup
                                onSelect={(_selected, info, authorized) => {
                                    setChurch(info);
                                    setShowChurchSearch(false);

                                    if (authorized) {
                                        addUserChurch(info);
                                    }
                                }}
                                showTips={ChurchSearchTips.Basic}
                                allowAdd={!isEventOwner ? {
                                    authorizeChurch: true,
                                    onAdding: setAddingChurchState
                                } : undefined}
                            />
                        </div>
                    )}
                </CollapsibleSection>

                {/* Only show remaining sections if a church is selected and no permission error */}
                {church && !churchPermissionError && (
                    <>
                        {/* Teams Section */}
                        {(event.MaxTeamMembers > 0 || (registration?.Teams?.length ?? 0) > 0) && (
                            <CollapsibleSection
                                pageId={PAGE_ID}
                                elementId="teams"
                                icon="fas faPeopleGroup"
                                title="Teams"
                                defaultOpen
                                badges={teamCount > 0 ? [{ className: "badge-lg badge-soft badge-primary", icon: "fas faPeopleGroup", text: teamCount.toString() }] : []}
                                addTopPadding={true}
                            >
                                {/* Team Cards */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {registration?.Teams?.map(team => (
                                        <div
                                            key={`team-${team.Id}`}
                                            className="card card-compact bg-base-200 border border-base-300 cursor-pointer hover:border-primary transition-colors mt-0"
                                            onClick={() => setEditingTeam(team)}
                                        >
                                            <div className="card-body p-3">
                                                <h3 className="card-title text-sm m-0">{team.Name}</h3>
                                                {team.DivisionId && event.Divisions?.length > 0 && (
                                                    <p className="text-xs m-0 opacity-70">
                                                        {event.Divisions.find(d => d.Id === team.DivisionId)?.Label ?? ""}
                                                    </p>
                                                )}
                                                <p className="text-xs m-0">
                                                    <FontAwesomeIcon icon="fas faPerson" classNames={["mr-1"]} />
                                                    {team.People?.length ?? 0} quizzer{(team.People?.length ?? 0) !== 1 ? "s" : ""}
                                                </p>
                                                {event.CalculatePayment && (
                                                    <p className="text-xs m-0 font-semibold">
                                                        ${team.CalculatedPayment?.toFixed(2) ?? "0.00"}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {isEditable && sectionEditability.teams && (
                                        <button
                                            type="button"
                                            className="card card-compact bg-base-200 border border-dashed border-base-300 hover:border-primary transition-colors cursor-pointer mt-0"
                                            onClick={() => setIsAddingTeam(true)}
                                        >
                                            <div className="card-body p-3 items-center justify-center">
                                                <FontAwesomeIcon icon="fas faPlus" />
                                                <span className="text-xs">Add Team</span>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </CollapsibleSection>
                        )}

                        {/* Individual Quizzers Section */}
                        {event.AllowIndividuals && (
                            <CollapsibleSection
                                pageId={PAGE_ID}
                                elementId="individuals"
                                icon="fas faPerson"
                                title="Individual Quizzers"
                                defaultOpen
                                badges={individualCount > 0 ? [{ className: "badge-lg badge-soft badge-info", icon: "fas faPerson", text: individualCount.toString() }] : []}
                                addTopPadding={true}
                            >
                                <PersonCardDeck
                                    icon="fas faPerson"
                                    event={event}
                                    scope={EventFieldScopes.QuizzerWithoutTeam}
                                    addLabel="Add Quizzer"
                                    people={registration?.Individuals ?? []}
                                    isEditable={isEditable && sectionEditability.teams}
                                    onEdit={person => setEditingPerson({ person, role: PersonRole.QuizzerWithoutTeam })}
                                    onAdd={() => setEditingPerson({ person: null, role: PersonRole.QuizzerWithoutTeam })}
                                />
                            </CollapsibleSection>
                        )}

                        {/* Officials Section */}
                        <CollapsibleSection
                            pageId={PAGE_ID}
                            elementId="officials"
                            icon="fas faUserTie"
                            title="Officials"
                            defaultOpen
                            badges={officialCount > 0 ? [{ className: "badge-lg badge-soft badge-info", icon: "fas faUserTie", text: officialCount.toString() }] : []}
                            addTopPadding={true}
                        >
                            <PersonCardDeck
                                icon="fas faUserTie"
                                event={event}
                                scope={EventFieldScopes.Official}
                                addLabel="Add Official"
                                people={registration?.Officials ?? []}
                                isEditable={isEditable && sectionEditability.officials}
                                onEdit={person => setEditingPerson({ person, role: PersonRole.Official })}
                                onAdd={() => setEditingPerson({ person: null, role: PersonRole.Official })}
                            />
                        </CollapsibleSection>

                        {/* Attendees Section */}
                        {event.AllowAttendees && (
                            <CollapsibleSection
                                pageId={PAGE_ID}
                                elementId="attendees"
                                icon="fas faUsers"
                                title="Attendees"
                                defaultOpen
                                badges={attendeeCount > 0 ? [{ className: "badge-lg badge-soft badge-info", icon: "fas faUsers", text: attendeeCount.toString() }] : []}
                                addTopPadding={true}
                            >
                                <PersonCardDeck
                                    icon="fas faPerson"
                                    event={event}
                                    scope={EventFieldScopes.Attendee}
                                    addLabel="Add Attendee"
                                    people={registration?.Attendees ?? []}
                                    isEditable={isEditable && sectionEditability.attendees}
                                    onEdit={person => setEditingPerson({ person, role: PersonRole.Attendee })}
                                    onAdd={() => setEditingPerson({ person: null, role: PersonRole.Attendee })}
                                />
                            </CollapsibleSection>
                        )}

                        {/* Forms Section */}
                        {registration?.Forms && registration.Forms.length > 0 && (
                            <CollapsibleSection
                                pageId={PAGE_ID}
                                elementId="forms"
                                icon="fas faFileLines"
                                title="Forms"
                                badges={[{ className: `badge-lg badge-soft ${formCompleted === formTotal ? "badge-success" : "badge-warning"}`, icon: "fas faFileLines", text: `${formCompleted}/${formTotal}` }]}
                                addTopPadding={true}
                            >
                                <div className="overflow-x-auto">
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Person</th>
                                                <th>Form</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {registration.Forms.map((form, idx) => (
                                                <tr key={`form-${idx}`}>
                                                    <td>{form.PersonName}</td>
                                                    <td>
                                                        {form.Url
                                                            ? <a href={form.Url} target="_blank" rel="noopener noreferrer" className="link">{form.FormName}</a>
                                                            : form.FormName}
                                                    </td>
                                                    <td>
                                                        {form.CompletedDate
                                                            ? <span className="text-success"><FontAwesomeIcon icon="fas faCircleCheck" classNames={["mr-1"]} />{DataTypeHelpers.formatDate(form.CompletedDate)}</span>
                                                            : <span className="text-error"><FontAwesomeIcon icon="fas faCircleXmark" classNames={["mr-1"]} />Incomplete</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CollapsibleSection>
                        )}

                        {/* Payment Section */}
                        {(event.CalculatePayment || event.TrackPayments) && registration && (
                            <CollapsibleSection
                                pageId={PAGE_ID}
                                elementId="payment"
                                icon="fas faCreditCard"
                                title="Payment"
                                defaultOpen
                                addTopPadding={true}
                            >
                                <div className="flex flex-wrap gap-4 items-center">
                                    {event.CalculatePayment && (
                                        <div className="stat p-2 pb-0 pt-0 mt-0 mb-0">
                                            <div className="stat-title text-xs">Total Cost</div>
                                            <div className="stat-value text-lg">${registration.CalculatedPayment?.toFixed(2) ?? "0.00"}</div>
                                        </div>
                                    )}
                                    {event.TrackPayments && (
                                        <>
                                            <div className="stat p-2 pt-0 pb-0 mt-0 mb-0">
                                                <div className="stat-title text-xs">Balance Due</div>
                                                <div className="stat-value text-lg text-error">${registration.PaymentBalance?.toFixed(2) ?? "0.00"}</div>
                                            </div>
                                            {registration.PendingPaymentBalance > 0 && (
                                                <div className="stat p-2 pt-0 pb-0 mt-0 mb-0">
                                                    <div className="stat-title text-xs">Pending</div>
                                                    <div className="stat-value text-lg text-warning">${registration.PendingPaymentBalance.toFixed(2)}</div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-2 mt-2">
                                    {(event.TrackPayments && Math.max(0, registration.CalculatedPayment - registration.PendingPaymentBalance - registration.PaymentBalance) > 0) && (
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-primary m-0"
                                            onClick={() => {
                                                window.location.href = RegistrationService.getPayLink(eventId, registration.ChurchId);
                                            }}>
                                            <FontAwesomeIcon icon="fas faCreditCard" classNames={["mr-1"]} />
                                            Pay Now
                                        </button>
                                    )}
                                    <a
                                        href={`#/${eventId}/${church!.Id}/Receipt`}
                                        className="btn btn-sm btn-outline m-0"
                                    >
                                        <FontAwesomeIcon icon="fas faReceipt" classNames={["mr-1"]} />
                                        View Receipt
                                    </a>
                                </div>

                                {/* Payment Entries Management (Event Owners Only) */}
                                {event.TrackPayments && isEventOwner && (
                                    <div className="mt-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-base">Payment Entries</h4>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-primary m-0"
                                                disabled={isSavingPaymentEntries || !paymentEntriesLoaded}
                                                onClick={() => setEditingPaymentEntry({
                                                    Id: null,
                                                    EntryDate: DataTypeHelpers.formatDate(DataTypeHelpers.nowDateOnly, "yyyy-MM-dd")!,
                                                    Description: "",
                                                    Amount: 0,
                                                    IsAutomated: false
                                                } as PaymentEntry)}
                                            >
                                                <FontAwesomeIcon icon="fas faPlus" classNames={["mr-1"]} />
                                                Add Entry
                                            </button>
                                        </div>

                                        {paymentEntriesError && (
                                            <div className="alert alert-error mb-2">
                                                <FontAwesomeIcon icon="fas faCircleExclamation" classNames={["mr-2"]} />
                                                {paymentEntriesError}
                                            </div>
                                        )}

                                        {!paymentEntriesLoaded ? (
                                            <div className="flex items-center gap-2 py-4">
                                                <span className="loading loading-spinner loading-sm"></span>
                                                <span className="text-base-content/60">Loading payment entries...</span>
                                            </div>
                                        ) : paymentEntries.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="table table-sm">
                                                    <thead>
                                                        <tr>
                                                            <th>Date</th>
                                                            <th>Description</th>
                                                            <th className="text-right">Amount</th>
                                                            <th className="w-10"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {paymentEntries.map((entry, index) => (
                                                            <tr key={entry.Id ?? `new-${index}`} className={entry.IsAutomated ? "opacity-60" : ""}>
                                                                <td>{DataTypeHelpers.formatDate(DataTypeHelpers.parseDateOnly(entry.EntryDate), "MMM d, yyyy")}</td>
                                                                <td>
                                                                    {entry.Description}
                                                                    {entry.IsAutomated && (
                                                                        <span className="badge badge-sm badge-ghost ml-2">Auto</span>
                                                                    )}
                                                                </td>
                                                                <td className={`text-right ${entry.Amount >= 0 ? "text-success" : "text-error"}`}>
                                                                    {entry.Amount >= 0 ? "" : "-"}${Math.abs(entry.Amount).toFixed(2)}
                                                                </td>
                                                                <td>
                                                                    {!entry.IsAutomated && (
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-xs btn-ghost m-0"
                                                                            disabled={isSavingPaymentEntries}
                                                                            onClick={() => setEditingPaymentEntry(entry)}
                                                                            title="Edit entry"
                                                                        >
                                                                            <FontAwesomeIcon icon="fas faPen" />
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot>
                                                        <tr className="font-semibold">
                                                            <td colSpan={2}>Total</td>
                                                            <td className="text-right">
                                                                ${paymentEntries.reduce((sum, e) => sum + e.Amount, 0).toFixed(2)}
                                                            </td>
                                                            <td></td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-base-content/60 italic">No payment entries recorded.</p>
                                        )}

                                        {paymentEntriesDirty && (
                                            <div className="flex gap-2 mt-4">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-success m-0"
                                                    disabled={isSavingPaymentEntries}
                                                    onClick={async () => {
                                                        if (!church) return;
                                                        setIsSavingPaymentEntries(true);
                                                        setPaymentEntriesError(null);
                                                        try {
                                                            await RegistrationService.updateChurchBalanceEntries(
                                                                auth,
                                                                eventId,
                                                                church!.Id!,
                                                                paymentEntries
                                                            );
                                                            setPaymentEntriesDirty(false);
                                                            // Reload registration to get updated balance
                                                            reloadRegistration();
                                                        } catch (err) {
                                                            setPaymentEntriesError(err instanceof Error ? err.message : "Failed to save payment entries");
                                                        } finally {
                                                            setIsSavingPaymentEntries(false);
                                                        }
                                                    }}
                                                >
                                                    {isSavingPaymentEntries ? (
                                                        <span className="loading loading-spinner loading-xs mr-1"></span>
                                                    ) : (
                                                        <FontAwesomeIcon icon="fas faCheck" classNames={["mr-1"]} />
                                                    )}
                                                    Save Payment Entries
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-ghost m-0"
                                                    disabled={isSavingPaymentEntries}
                                                    onClick={() => {
                                                        // Re-fetch payment entries to revert changes
                                                        setPaymentEntriesLoaded(false);
                                                        setPaymentEntriesDirty(false);
                                                        setPaymentEntriesError(null);
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>)}
                                    </div>)}
                            </CollapsibleSection>
                        )}
                    </>
                )}

            </fieldset>

            {/* Save Bar */}
            {isEditable && (
                <RegistrationSaveBar
                    isDirty={isDirty}
                    isSaving={isSaving}
                    onSave={saveRegistration}
                />
            )}

            {/* Team Dialog */}
            {(editingTeam || isAddingTeam) && church && (
                <RegistrationTeamDialog
                    event={event}
                    church={church}
                    eventId={eventId}
                    team={editingTeam}
                    onClose={(result) => {
                        setEditingTeam(null);
                        setIsAddingTeam(false);
                        if (result) {
                            setRegistrationVersion(result.NewVersion ?? registrationVersion);
                            reloadRegistration();
                        }
                    }}
                />
            )}

            {/* Person Dialog */}
            {editingPerson && church && (
                <RegistrationPersonDialog
                    title={editingPerson.person ? "Edit Person" : "Add Person"}
                    event={event}
                    church={church}
                    existingPerson={editingPerson.person}
                    role={editingPerson.role}
                    existingPeopleIds={new Set()}
                    onClose={(result) => {
                        if (result === "delete" && editingPerson.person) {
                            handleRemovePerson(editingPerson.person, editingPerson.role);
                        } else if (result && result !== "delete") {
                            handlePersonDialogClose(result, editingPerson.role);
                        }
                        setEditingPerson(null);
                    }}
                />
            )}

            {/* Email Coordinator Dialog */}
            {showEmailDialog && (
                <EmailCoordinatorDialog
                    eventId={eventId}
                    eventName={event.Name}
                    onClose={() => setShowEmailDialog(false)}
                />
            )}

            {/* Add Church Dialog */}
            {addingChurchState && (
                <ChurchSettingsDialog
                    title="Add Church"
                    addState={addingChurchState}
                    authorizeChurch={true}
                    onSave={(newChurch) => {
                        setAddingChurchState(null);
                        if (newChurch) {
                            addUserChurch(newChurch);
                            setChurch(newChurch);
                            setShowChurchSearch(false);
                        }
                    }}
                />
            )}

            {/* Payment Entry Dialog */}
            {editingPaymentEntry && (
                <EventPaymentsEntryDialog
                    entry={editingPaymentEntry}
                    onClose={(updatedEntry) => {
                        if (updatedEntry) {
                            if (updatedEntry.Id) {
                                // Edit existing entry
                                setPaymentEntries(prev =>
                                    prev.map(e => e.Id === updatedEntry.Id ? updatedEntry : e)
                                );
                            } else {
                                // Add new entry with temporary ID
                                updatedEntry.Id = `new-${Date.now()}`;
                                setPaymentEntries(prev => [...prev, updatedEntry]);
                            }
                            setPaymentEntriesDirty(true);
                        }
                        setEditingPaymentEntry(null);
                    }}
                    onDelete={() => {
                        if (editingPaymentEntry.Id) {
                            setPaymentEntries(prev =>
                                prev.filter(e => e.Id !== editingPaymentEntry.Id)
                            );
                            setPaymentEntriesDirty(true);
                        }
                        setEditingPaymentEntry(null);
                    }}
                />
            )}
        </div>
    );
}

function EmailCoordinatorDialog({ eventId, eventName, onClose }: { eventId: string; eventName: string; onClose: () => void }) {
    useEscapeToClose(onClose);

    return (
        <dialog
            className="modal"
            open
            ref={el => { if (el && !el.open) el.showModal(); }}
        >
            <div className="modal-box max-w-3xl w-11/12 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg m-0">
                        <FontAwesomeIcon icon="fas faEnvelope" classNames={["mr-2"]} />
                        Email Coordinator
                    </h3>
                    <button
                        type="button"
                        className="btn btn-sm btn-circle btn-ghost m-0"
                        onClick={onClose}
                    >
                        <FontAwesomeIcon icon="fas faXmark" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <EmailForm
                        eventId={eventId}
                        eventName={eventName}
                        types={[EmailRecipientType.EventAdministrators]}
                        messageTitle={eventName}
                        subjectPrefix={`[${eventName}] `}
                    />
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button type="button" onClick={onClose}>close</button>
            </form>
        </dialog>
    );
}
