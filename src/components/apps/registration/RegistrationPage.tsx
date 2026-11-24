import { useEffect, useState } from "react";
import { useOutletContext, useParams, useSearchParams } from "react-router-dom";
import type { RegistrationProviderContext } from "./RegistrationProvider";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import ChurchLookup, { ChurchSearchTips } from "components/ChurchLookup";
import PersonCardDeck from "./PersonCardDeck";
import RegistrationBanner from "./RegistrationBanner";
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
import ConfirmationDialog from "components/ConfirmationDialog";
import { getRegistrationSteps, getStepPath, type RegistrationStep } from "./RegistrationSteps";

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
        registrationVersion,
        setRegistrationVersion,
        reloadRegistration,
        isEditable,
        sectionEditability,
        churchPermissionError,
        isSaving,
        saveRegistration,
    } = context;

    const { stepId } = useParams();
    const [searchParameters] = useSearchParams();

    // "Change" on any step comes back here with ?choose=1, so a single church isn't preselected again.
    const isChoosingChurch = searchParameters.get("choose") === "1";

    const [showChurchSearch, setShowChurchSearch] = useState(false);
    const [registeredChurchIds, setRegisteredChurchIds] = useState<Set<string>>(new Set());
    const [editingTeam, setEditingTeam] = useState<RegistrationTeam | null>(null);
    const [isAddingTeam, setIsAddingTeam] = useState(false);
    const [removingTeam, setRemovingTeam] = useState<RegistrationTeam | null>(null);
    // Server messages arrive HTML-encoded; local fallbacks are plain text and are never rendered as HTML.
    const [teamError, setTeamError] = useState<{ html?: string; text?: string } | null>(null);
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

    // Checkout state for the church paying its own registration
    const [isStartingPayment, setIsStartingPayment] = useState(false);
    const [startPaymentError, setStartPaymentError] = useState<string | null>(null);

    // The button stays disabled once the browser starts navigating to the payment processor, but a back
    // navigation can restore this page from the browser's cache with that state intact, which would leave
    // the button spinning and unusable. Re-enable it whenever the page is restored.
    useEffect(() => {
        const handlePageShow = (pageEvent: PageTransitionEvent) => {
            if (pageEvent.persisted) {
                setIsStartingPayment(false);
            }
        };

        window.addEventListener("pageshow", handlePageShow);
        return () => window.removeEventListener("pageshow", handlePageShow);
    }, []);

    // With exactly one church, preselect it and skip choosing (R2).
    useEffect(() => {
        // Event owners often register other churches, so they always choose.
        if (!church && !isChoosingChurch && !isEventOwner && !isLoadingUserChurches && userChurches.length === 1) {
            setChurch(userChurches[0]);
        }
    }, [church, isChoosingChurch, isEventOwner, isLoadingUserChurches, userChurches]);

    // Mark the churches already registered for this event, so choosing one opens its summary (R2).
    useEffect(() => {
        if (church && !isChoosingChurch) {
            return;
        }

        let isCancelled = false;
        Promise.allSettled(userChurches.map(c =>
            RegistrationService.getRegistrations(auth, 1, 0, eventId, c.Id!)))
            .then(results => {
                if (isCancelled) {
                    return;
                }

                const ids = new Set<string>();
                results.forEach((result, index) => {
                    if (result.status === "fulfilled" && result.value.Items.length > 0) {
                        ids.add(userChurches[index].Id!);
                    }
                });
                setRegisteredChurchIds(ids);
            });

        return () => { isCancelled = true; };
    }, [userChurches, eventId, church, isChoosingChurch]);

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

    // People edit handlers. Each change is saved right away (like teams), so nothing is left unsaved for a
    // team or payment save to reload over. A rejected save throws, and the dialog shows why.
    const handlePersonSaved = async (updatedPerson: RegistrationPerson, role: PersonRole): Promise<void> => {
        if (!registration) return;

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

        await saveRegistration(updated);
    };

    const handleRemovePerson = async (person: RegistrationPerson, role: PersonRole): Promise<void> => {
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

        await saveRegistration(updated);
    };

    // ---------- Steps (R1, R2) ----------

    // With exactly one church, it's preselected and choosing it isn't a step.
    const includeChurchStep = isLoadingUserChurches || userChurches.length !== 1 || isChoosingChurch || isEventOwner;
    const steps = getRegistrationSteps(event, registration, includeChurchStep);
    const firstStep = steps.find(s => s.id !== "church") ?? steps[0];
    const isRegistered = !!registration?.Id;

    let currentStep: RegistrationStep | null = null;
    if (!church || isChoosingChurch) {
        currentStep = steps.find(s => s.id === "church") ?? null;
    }
    else if (stepId) {
        currentStep = steps.find(s => s.id === stepId) ?? firstStep;
    }
    else if (!isRegistered) {
        currentStep = firstStep;
    }

    const stepIndex = currentStep ? steps.findIndex(s => s.id === currentStep!.id) : -1;
    const previousStep = stepIndex > 0 ? steps[stepIndex - 1] : null;
    const nextStep = stepIndex >= 0 && stepIndex < steps.length - 1 ? steps[stepIndex + 1] : null;

    // ---------- Section contents ----------

    const renderChurch = () => (
        <>
        {/* Permission error */}
        {churchPermissionError && (
            <div role="alert" className="alert alert-error mb-2">
                <FontAwesomeIcon icon="fas faCircleExclamation" />
                <span>{churchPermissionError}</span>
            </div>
        )}

        {/* No church selected prompt */}
        {!church && (
            <p className="bq-reg-lead mb-2">Which church are you registering?</p>
        )}

        {/* Large choices, marked when already registered (R2). */}
        {!isLoadingUserChurches && userChurches.length > 0 && (
            <div className="bq-reg-churches">
                {userChurches.map(c => {
                    const isSelected = church?.Id === c.Id;
                    const location = formatChurchLocation(c);
                    const isRegisteredChurch = registeredChurchIds.has(c.Id!);
                    return (
                        <button
                            key={`church-${c.Id}`}
                            type="button"
                            className={`bq-reg-church ${isSelected ? "is-selected" : ""}`}
                            onClick={() => setChurch(c)}
                        >
                            <FontAwesomeIcon icon="fas faChurch" />
                            <span className="bq-reg-church-text">
                                <span className="bq-reg-church-name">{c.Name}</span>
                                {location && <span className="bq-reg-church-location">{location}</span>}
                            </span>
                            {isRegisteredChurch && (
                                <span className="bq-reg-church-badge">
                                    <FontAwesomeIcon icon="fas faCircleCheck" />
                                    Already registered
                                </span>)}
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

        {/* Find another church: search, ending with "Add a new church" (R2). */}
        {!showChurchSearch && (
            <button
                type="button"
                className="btn btn-outline btn-sm m-0"
                onClick={() => setShowChurchSearch(true)}
            >
                <FontAwesomeIcon icon="fas faMagnifyingGlass" classNames={["mr-1"]} />
                Find another church
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
        </>);

    // Teams follow the people pattern (R3): "+ Add team" at the top, then a card per team with Edit and Remove.
    // A team is named first in its dialog, then quizzers and coaches are added inside it the same way as people.
    const canChangeTeams = isEditable && sectionEditability.teams;

    const removeTeam = async (team: RegistrationTeam) => {
        setRemovingTeam(null);
        setTeamError(null);
        try {
            const result = await RegistrationService.deleteTeam(auth, eventId, church!.Id!, team.Version ?? 0, team.Id!);
            setRegistrationVersion(result.NewVersion ?? registrationVersion);
            await reloadRegistration();
        }
        catch (error) {
            const message = (error as Error)?.message;
            setTeamError(message ? { html: message } : { text: `${team.Name} couldn't be removed.` });
        }
    };

    const renderTeams = () => (
        <>
            {canChangeTeams && (
                <button
                    type="button"
                    className="btn btn-primary bq-people-add"
                    onClick={() => setIsAddingTeam(true)}>
                    <FontAwesomeIcon icon="fas faPlus" />
                    Add Team
                </button>)}
            {teamError && (
                <div role="alert" className="alert alert-error">
                    <FontAwesomeIcon icon="fas faCircleExclamation" />
                    {/* The server HTML-encodes the values in its messages. */}
                    {teamError.html
                        ? <span dangerouslySetInnerHTML={{ __html: teamError.html }} />
                        : <span>{teamError.text}</span>}
                </div>)}
            <div className="bq-people">
                {registration?.Teams?.map(team => {
                    const divisionLabel = team.DivisionId
                        ? event.Divisions?.find(d => d.Id === team.DivisionId)?.Label
                        : undefined;
                    const coachCount = team.People?.filter(p => p.Role === PersonRole.Coach).length ?? 0;
                    const quizzerCount = (team.People?.length ?? 0) - coachCount;

                    return (
                        <article key={`team-${team.Id}`} className="bq-person">
                            <h4 className="bq-person-name">
                                <FontAwesomeIcon icon="fas faPeopleGroup" />
                                {team.Name}
                            </h4>
                            <ul className="m-0 p-0 list-none text-sm">
                                {(event.Divisions?.length ?? 0) > 0 && (
                                    divisionLabel
                                        ? <li className="text-base-content/70">{divisionLabel}</li>
                                        : (
                                            <li className="text-warning font-semibold">
                                                <FontAwesomeIcon icon="fas faTriangleExclamation" classNames={["mr-1"]} />
                                                Select a division
                                            </li>))}
                                <li className="text-base-content/70">
                                    {quizzerCount} quizzer{quizzerCount !== 1 ? "s" : ""}
                                    {coachCount > 0 && ` · ${coachCount} coach${coachCount !== 1 ? "es" : ""}`}
                                </li>
                                {event.CalculatePayment && (
                                    <li className="font-semibold">${team.CalculatedPayment?.toFixed(2) ?? "0.00"}</li>)}
                            </ul>
                            <div className="bq-person-actions">
                                <button type="button" className="btn btn-sm btn-outline m-0" onClick={() => setEditingTeam(team)}>
                                    <FontAwesomeIcon icon={canChangeTeams ? "fas faPenToSquare" : "fas faEye"} />
                                    {canChangeTeams ? "Edit" : "View"}
                                </button>
                                {canChangeTeams && (
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-ghost text-error m-0"
                                        onClick={() => setRemovingTeam(team)}>
                                        <FontAwesomeIcon icon="fas faTrash" />
                                        Remove
                                    </button>)}
                            </div>
                        </article>);
                })}
            </div>
            {(registration?.Teams?.length ?? 0) === 0 && (
                <p className="bq-people-empty">No teams yet.</p>)}
            {removingTeam && (
                <ConfirmationDialog
                    title={`Remove ${removingTeam.Name}?`}
                    yesLabel="Remove team"
                    noLabel="Keep"
                    onYes={() => void removeTeam(removingTeam)}
                    onNo={() => setRemovingTeam(null)}>
                    {removingTeam.Name} and everyone on it will be taken off this registration.
                </ConfirmationDialog>)}
        </>);

    const renderPeople = (role: PersonRole) => {
        switch (role) {
            case PersonRole.QuizzerWithoutTeam:
                return (
                    <PersonCardDeck
                        icon="fas faPerson"
                        event={event}
                        scope={EventFieldScopes.QuizzerWithoutTeam}
                        addLabel="Add Quizzer"
                        people={registration?.Individuals ?? []}
                        isEditable={isEditable && sectionEditability.teams}
                        onEdit={person => setEditingPerson({ person, role: PersonRole.QuizzerWithoutTeam })}
                        onAdd={() => setEditingPerson({ person: null, role: PersonRole.QuizzerWithoutTeam })}
                        onRemove={person => handleRemovePerson(person, PersonRole.QuizzerWithoutTeam)}
                    />);
            case PersonRole.Attendee:
                return (
                    <PersonCardDeck
                        icon="fas faPerson"
                        event={event}
                        scope={EventFieldScopes.Attendee}
                        addLabel="Add Attendee"
                        people={registration?.Attendees ?? []}
                        isEditable={isEditable && sectionEditability.attendees}
                        onEdit={person => setEditingPerson({ person, role: PersonRole.Attendee })}
                        onAdd={() => setEditingPerson({ person: null, role: PersonRole.Attendee })}
                        onRemove={person => handleRemovePerson(person, PersonRole.Attendee)}
                    />);
            default:
                return (
                    <PersonCardDeck
                        icon="fas faUserTie"
                        event={event}
                        scope={EventFieldScopes.Official}
                        addLabel="Add Official"
                        people={registration?.Officials ?? []}
                        isEditable={isEditable && sectionEditability.officials}
                        onEdit={person => setEditingPerson({ person, role: PersonRole.Official })}
                        onAdd={() => setEditingPerson({ person: null, role: PersonRole.Official })}
                        onRemove={person => handleRemovePerson(person, PersonRole.Official)}
                    />);
        }
    };

    // Forms checklist grouped by person (R4). People may continue with forms outstanding.
    const renderForms = () => {
        const forms = registration?.Forms ?? [];
        const byPerson = new Map<string, typeof forms>();
        for (const form of forms) {
            const key = form.PersonName || "Church";
            byPerson.set(key, [...(byPerson.get(key) ?? []), form]);
        }

        return (
            <>
                <p className="bq-reg-lead">
                    <strong>{formCompleted} of {formTotal} forms done.</strong>{" "}
                    {formCompleted < formTotal && "You can keep going and finish the rest later."}
                </p>
                <div className="bq-reg-forms">
                    {[...byPerson.entries()].map(([personName, personForms]) => (
                        <div key={personName} className="bq-reg-form-person">
                            <h3>{personName}</h3>
                            <ul>
                                {personForms.map((form, index) => (
                                    <li key={`${personName}-${index}`}>
                                        <span className="bq-reg-form-name">{form.FormName}</span>
                                        {form.CompletedDate
                                            ? (
                                                <span className="bq-reg-form-status is-done">
                                                    <FontAwesomeIcon icon="fas faCircleCheck" />
                                                    Done {DataTypeHelpers.formatDate(form.CompletedDate)}
                                                </span>)
                                            : <span className="bq-reg-form-status">Not done</span>}
                                        {form.Url && (
                                            <a href={form.Url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline m-0">
                                                {form.CompletedDate ? "View form" : "Open form"}
                                                <FontAwesomeIcon icon="fas faArrowUpRightFromSquare" />
                                            </a>)}
                                    </li>))}
                            </ul>
                        </div>))}
                </div>
            </>);
    };

    const renderPayment = () => (event.CalculatePayment || event.TrackPayments) && registration && (
        <div className="bq-reg-payment">
            <h3>Payment</h3>
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
                    className="btn btn-lg btn-primary m-0"
                    disabled={isStartingPayment}
                    onClick={async () => {
                        setIsStartingPayment(true);
                        setStartPaymentError(null);
                        try {
                            // Send the browser back to the receipt once the payment completes.
                            // "paid" tells the receipt to reconcile before it renders.
                            const returnUrl = `${window.location.origin}${window.location.pathname}#/${eventId}/${registration.ChurchId}/Receipt?paid=1`;
                            const paymentLink = await RegistrationService.startPayment(
                                auth,
                                eventId,
                                registration.ChurchId,
                                returnUrl
                            );

                            window.location.href = paymentLink.Url;
                        } catch (err: any) {
                            // The services reject with a RemoteServiceError object rather than an
                            // Error instance, so the message has to be read off whatever was thrown.
                            setStartPaymentError(err?.message || "Failed to start the payment");
                            setIsStartingPayment(false);
                        }
                    }}>
                    {isStartingPayment ? (
                        <span className="loading loading-spinner loading-xs mr-1"></span>
                    ) : (
                        <FontAwesomeIcon icon="fas faCreditCard" classNames={["mr-1"]} />
                    )}
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
        {startPaymentError && (
            <div className="alert alert-error alert-sm mt-2">
                <span className="text-sm">{startPaymentError}</span>
            </div>
        )}

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
        </div>);

    // ---------- Step status, for the summary cards and the review recap (R1, R4) ----------

    const plural = (count: number, singular: string, pluralLabel: string = `${singular}s`) =>
        `${count} ${count === 1 ? singular : pluralLabel}`;

    const getStepStatus = (step: RegistrationStep): { text: string; isWarning?: boolean } => {
        switch (step.id) {
            case "teams": {
                const missingDivision = (event.Divisions?.length ?? 0) > 0
                    ? (registration?.Teams ?? []).filter(t => !t.DivisionId).length
                    : 0;
                return missingDivision > 0
                    ? { text: `${plural(teamCount, "team")} · ${missingDivision === 1 ? "1 team needs" : `${missingDivision} teams need`} a division`, isWarning: true }
                    : { text: plural(teamCount, "team") };
            }
            case "individuals":
                return { text: plural(individualCount, "quizzer") };
            case "officials":
                return { text: plural(officialCount, "official") };
            case "attendees":
                return { text: plural(attendeeCount, "attendee") };
            case "forms":
                return formCompleted < formTotal
                    ? { text: `${plural(formTotal - formCompleted, "form")} still needed`, isWarning: true }
                    : { text: "All forms done" };
            case "review":
                if (event.TrackPayments && registration) {
                    return { text: `Balance due: $${registration.PaymentBalance?.toFixed(2) ?? "0.00"}` };
                }
                if (event.CalculatePayment && registration) {
                    return { text: `Total cost: $${registration.CalculatedPayment?.toFixed(2) ?? "0.00"}` };
                }
                {
                    const people = (registration?.Teams ?? []).reduce((sum, t) => sum + (t.People?.length ?? 0), 0)
                        + individualCount + officialCount + attendeeCount;
                    return { text: `${plural(people, "person", "people")} registered` };
                }
            default:
                return { text: church?.Name ?? "" };
        }
    };

    const renderStepCards = (cardSteps: RegistrationStep[]) => (
        <div className="bq-reg-cards">
            {cardSteps.map(step => {
                const status = getStepStatus(step);
                return (
                    <a key={step.id} className="bq-reg-card" href={getStepPath(eventId, church?.Id, step.id)}>
                        <span className="bq-reg-card-icon"><FontAwesomeIcon icon={step.icon} /></span>
                        <span className="bq-reg-card-text">
                            <span className="bq-reg-card-title">{step.label}</span>
                            <span className={`bq-reg-card-status ${status.isWarning ? "is-warning" : ""}`}>
                                {status.isWarning && <FontAwesomeIcon icon="fas faTriangleExclamation" />}
                                {status.text}
                            </span>
                        </span>
                        <span className="bq-reg-card-action">{isEditable ? "Edit" : "View"}</span>
                    </a>);
            })}
        </div>);

    const renderStepContent = (step: RegistrationStep) => {
        switch (step.id) {
            case "church":
                return renderChurch();
            case "teams":
                return renderTeams();
            case "individuals":
                return renderPeople(PersonRole.QuizzerWithoutTeam);
            case "officials":
                return renderPeople(PersonRole.Official);
            case "attendees":
                return renderPeople(PersonRole.Attendee);
            case "forms":
                return renderForms();
            case "review":
                return (
                    <>
                        {renderStepCards(steps.filter(s => s.id !== "church" && s.id !== "review"))}
                        {renderPayment()}
                    </>);
        }
    };

    return (
        <div className="flex flex-col gap-3 bq-reg">
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
                            {event.ArchiveLink && (
                                <a
                                    href={`/${event.ArchiveLink}`}
                                    className="btn btn-sm btn-outline m-0"
                                >
                                    <FontAwesomeIcon icon="fas faTowerBroadcast" classNames={["mr-1"]} />
                                    Live Scores
                                </a>
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

                {/* Which church every step is for (R2). */}
                {church && !isChoosingChurch && (
                    <p className="bq-reg-for">
                        <FontAwesomeIcon icon="fas faChurch" />
                        <span>Registering for: <strong>{church.Name}</strong></span>
                        <a href={getStepPath(eventId, null, "church")}>Change</a>
                    </p>)}

                {currentStep && (
                    <section className="bq-reg-step" aria-labelledby="bq-reg-step-title">
                        {/* Progress (R1): every step can be tapped. */}
                        {!isLoadingUserChurches && (
                        <div className="bq-reg-progress">
                            <p className="bq-reg-progress-label">
                                Step {stepIndex + 1} of {steps.length}: <strong>{currentStep.label}</strong>
                            </p>
                            <ol>
                                {steps.map((step, index) => (
                                    <li key={step.id}>
                                        <a
                                            href={church || step.id === "church" ? getStepPath(eventId, church?.Id, step.id) : undefined}
                                            aria-current={index === stepIndex ? "step" : undefined}
                                            className={index < stepIndex ? "is-before" : ""}
                                            title={step.label}>
                                            <span className="sr-only">{step.label}</span>
                                        </a>
                                    </li>))}
                            </ol>
                        </div>
                        )}

                        <h2 id="bq-reg-step-title" className="bq-reg-step-title">
                            <FontAwesomeIcon icon={currentStep.icon} />
                            {currentStep.label}
                        </h2>

                        {church && churchPermissionError && currentStep.id !== "church"
                            ? (
                                <div role="alert" className="alert alert-error">
                                    <FontAwesomeIcon icon="fas faCircleExclamation" />
                                    <span>{churchPermissionError}</span>
                                </div>)
                            : renderStepContent(currentStep)}

                        {/* Large Back and Next (R1). Every change is already saved. */}
                        {currentStep.id !== "church" && (
                            <nav className="bq-reg-nav" aria-label="Registration steps">
                                {previousStep
                                    ? (
                                        <a className="btn btn-lg btn-outline" href={getStepPath(eventId, church?.Id, previousStep.id)}>
                                            <FontAwesomeIcon icon="fas faArrowLeft" />
                                            Back
                                        </a>)
                                    : <span />}
                                {nextStep && (
                                    <a className="btn btn-lg btn-primary" href={getStepPath(eventId, church?.Id, nextStep.id)}>
                                        Next: {nextStep.label}
                                        <FontAwesomeIcon icon="fas faArrowRight" />
                                    </a>)}
                                {!nextStep && isRegistered && (
                                    <a className="btn btn-lg btn-primary" href={`#/${eventId}/${church!.Id}`}>
                                        <FontAwesomeIcon icon="fas faCheck" />
                                        Done
                                    </a>)}
                            </nav>)}
                        {currentStep.id === "review" && !isRegistered && (
                            <p className="bq-reg-lead">
                                Nothing is registered yet: add at least one team or person to register.
                            </p>)}
                    </section>)}

                {/* Summary screen (R1): once started, a registration opens here. */}
                {!currentStep && church && (
                    <section className="bq-reg-summary">
                        <h2>Your registration</h2>
                        {renderStepCards(steps.filter(s => s.id !== "church"))}
                        {/* Event owners' payment tools stay on the summary screen (R4). */}
                        {isEventOwner && renderPayment()}
                    </section>)}

            </fieldset>

            {/* Team Dialog */}
            {(editingTeam || isAddingTeam) && church && (
                <RegistrationTeamDialog
                    event={event}
                    church={church}
                    eventId={eventId}
                    team={editingTeam}
                    otherTeams={(registration?.Teams ?? []).filter(t => !editingTeam || t.Id !== editingTeam.Id)}
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
                    onSave={async (result) => {
                        if (result === "delete") {
                            if (editingPerson.person) {
                                await handleRemovePerson(editingPerson.person, editingPerson.role);
                            }
                        } else {
                            await handlePersonSaved(result, editingPerson.role);
                        }
                    }}
                    onClose={() => setEditingPerson(null)}
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
