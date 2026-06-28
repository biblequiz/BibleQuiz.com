import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { EventSummaryProviderContext } from "./EventSummaryProvider";
import {
    EventFieldDataType,
    EventsService,
    type EventChurchSummary,
    type EventFieldSummary,
    type EventOfficialSummary,
    type EventPersonSummary,
    type EventSummary,
    type EventTeamSummary,
} from "types/services/EventsService";
import { PersonRole } from "types/services/PeopleService";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

interface Props {
}

/** Sections that can be toggled on/off */
interface SectionVisibility {
    churches: boolean;
    teams: boolean;
    quizzersAndCoaches: boolean;
    officials: boolean;
    attendees: boolean;
}

/** Format a date for the date input */
function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/** Check if a row was modified after the highlight date */
function isHighlighted(lastModified: string | null | undefined, highlightDate: Date | null): boolean {
    if (!highlightDate || !lastModified) return false;
    const modified = new Date(lastModified);
    return modified >= highlightDate;
}

/** Format payment amount */
function formatPayment(amount: number): string {
    return `$${DataTypeHelpers.formatNumber(amount, 2)}`;
}

/** Render a field value for display */
function renderFieldValue(field: EventFieldSummary, value: string | null | undefined): React.ReactNode {
    if (value === null || value === undefined || value === "") {
        return <span className="text-base-content/30">—</span>;
    }

    switch (field.DataType) {
        case EventFieldDataType.Boolean:
            const isChecked = value === "Yes" || value === "1" || value === "true";
            return <input type="checkbox" className="checkbox checkbox-xs" checked={isChecked} disabled />;
        case EventFieldDataType.Number:
            return value;
        default:
            return value;
    }
}

/** Calculate field totals */
function calculateFieldTotal(
    field: EventFieldSummary,
    items: Array<{ Fields?: { [name: string]: string } }>
): number {
    let total = 0;
    for (const item of items) {
        const value = item.Fields?.[field.Id];
        if (!value) continue;

        switch (field.DataType) {
            case EventFieldDataType.Number:
                const parsed = parseInt(value);
                if (!isNaN(parsed)) total += parsed;
                break;
            case EventFieldDataType.Boolean:
                if (value === "Yes" || value === "1" || value === "true") total += 1;
                break;
        }
    }
    return total;
}

/** Mobile card for churches */
function ChurchCard({
    church,
    summary,
    isHighlighted,
    onEdit,
}: {
    church: EventChurchSummary;
    summary: EventSummary;
    isHighlighted: boolean;
    onEdit: () => void;
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={`card card-compact bg-base-100 border ${isHighlighted ? 'border-warning bg-warning/10' : 'border-base-300'} mt-0`}>
            <div className="card-body p-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="card-title text-sm m-0">{church.ChurchName}</h3>
                        <p className="text-xs text-base-content/70 m-0">
                            {church.ChurchLocation.City}, {church.ChurchLocation.State}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={() => setExpanded(!expanded)}
                    >
                        <FontAwesomeIcon icon={expanded ? "fas faChevronUp" : "fas faChevronDown"} />
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 text-xs mt-1">
                    <span className="badge badge-sm badge-outline">
                        <FontAwesomeIcon icon="fas faPeopleGroup" classNames={["mr-1"]} />
                        {church.TeamCount} teams
                    </span>
                    {summary.HasPayment && (
                        <span className="badge badge-sm badge-primary">
                            {formatPayment(church.CalculatedPayment)}
                        </span>
                    )}
                </div>

                {expanded && (
                    <div className="mt-2 pt-2 border-t border-base-300 text-xs space-y-1">
                        <p><strong>Coaches:</strong> {church.CoachNames.length > 0 ? church.CoachNames.join(", ") : "None"}</p>
                        <p><strong>Officials:</strong> {church.OfficialCount}</p>
                        {summary.TeamDivisions && (
                            <div>
                                <strong>Divisions:</strong>
                                <ul className="ml-4 list-disc">
                                    {summary.TeamDivisions.map(div => (
                                        <li key={div.Id}>{div.Name}: {church.Divisions?.[div.Id] ?? 0}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {summary.HasPaymentBalance && (
                            <p><strong>Paid:</strong> {formatPayment(Math.max(0, church.PaymentBalance))}</p>
                        )}
                        <button
                            type="button"
                            className="btn btn-primary btn-xs mt-2"
                            onClick={onEdit}
                        >
                            <FontAwesomeIcon icon="fas faPenToSquare" classNames={["mr-1"]} />
                            Edit Registration
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/** Mobile card for teams */
function TeamCard({
    team,
    summary,
    isHighlighted,
}: {
    team: EventTeamSummary;
    summary: EventSummary;
    isHighlighted: boolean;
}) {
    const [expanded, setExpanded] = useState(false);

    const quizzers = team.People?.filter(p => p.Role === PersonRole.Quizzer || p.Role === PersonRole.QuizzerWithoutTeam) ?? [];
    const coaches = team.People?.filter(p => p.Role === PersonRole.Coach) ?? [];

    return (
        <div className={`card card-compact bg-base-100 border ${isHighlighted ? 'border-warning bg-warning/10' : 'border-base-300'} mt-0`}>
            <div className="card-body p-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="card-title text-sm m-0">{team.Name}</h3>
                        <p className="text-xs text-base-content/70 m-0">
                            {team.ChurchName} ({team.ChurchLocation.City}, {team.ChurchLocation.State})
                        </p>
                    </div>
                    <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={() => setExpanded(!expanded)}
                    >
                        <FontAwesomeIcon icon={expanded ? "fas faChevronUp" : "fas faChevronDown"} />
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 text-xs mt-1">
                    <span className="badge badge-sm badge-outline">
                        {quizzers.length} quizzers
                    </span>
                    <span className="badge badge-sm badge-outline">
                        {coaches.length} coaches
                    </span>
                    {summary.HasPayment && (
                        <span className="badge badge-sm badge-primary">
                            {formatPayment(team.CalculatedPayment)}
                        </span>
                    )}
                </div>

                {expanded && (
                    <div className="mt-2 pt-2 border-t border-base-300 text-xs space-y-1">
                        {team.PointOfContact && (
                            <p><strong>Contact:</strong> {team.PointOfContact.FirstName} {team.PointOfContact.LastName}</p>
                        )}
                        {quizzers.length > 0 && (
                            <p><strong>Quizzers:</strong> {quizzers.map(p => p.PersonName).join(", ")}</p>
                        )}
                        {coaches.length > 0 && (
                            <p><strong>Coaches:</strong> {coaches.map(p => p.PersonName).join(", ")}</p>
                        )}
                        {summary.TeamFields.map(field => {
                            const value = team.Fields?.[field.Id];
                            if (!value) return null;
                            return (
                                <p key={field.Id}><strong>{field.Label}:</strong> {value}</p>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

/** Mobile card for person (quizzers, coaches, officials, attendees) */
function PersonCard({
    person,
    fields,
    isHighlighted,
    showTeam = false,
    showRolePreferences = false,
}: {
    person: EventPersonSummary | EventOfficialSummary;
    fields: EventFieldSummary[];
    isHighlighted: boolean;
    showTeam?: boolean;
    showRolePreferences?: boolean;
}) {
    const [expanded, setExpanded] = useState(false);

    const officialPerson = showRolePreferences ? (person as EventOfficialSummary) : null;

    return (
        <div className={`card card-compact bg-base-100 border ${isHighlighted ? 'border-warning bg-warning/10' : 'border-base-300'} mt-0`}>
            <div className="card-body p-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="card-title text-sm m-0">{person.PersonName}</h3>
                        <p className="text-xs text-base-content/70 m-0">{person.ChurchName}</p>
                    </div>
                    <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={() => setExpanded(!expanded)}
                    >
                        <FontAwesomeIcon icon={expanded ? "fas faChevronUp" : "fas faChevronDown"} />
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 text-xs mt-1">
                    {showTeam && person.TeamName && (
                        <span className="badge badge-sm badge-outline">{person.TeamName}</span>
                    )}
                    {showRolePreferences && officialPerson && (
                        <>
                            {officialPerson.QuizmasterPref && <span className="badge badge-sm badge-info">QM</span>}
                            {officialPerson.JudgePref && <span className="badge badge-sm badge-info">Judge</span>}
                            {officialPerson.ScorekeeperPref && <span className="badge badge-sm badge-info">SK</span>}
                            {officialPerson.TimekeeperPref && <span className="badge badge-sm badge-info">TK</span>}
                        </>
                    )}
                    {person.CalculatedPayment > 0 && (
                        <span className="badge badge-sm badge-primary">
                            {formatPayment(person.CalculatedPayment)}
                        </span>
                    )}
                </div>

                {expanded && (
                    <div className="mt-2 pt-2 border-t border-base-300 text-xs space-y-1">
                        {person.Email && <p><strong>Email:</strong> {person.Email}</p>}
                        {person.PhoneNumber && <p><strong>Phone:</strong> {person.PhoneNumber}</p>}
                        {showRolePreferences && officialPerson?.DivisionPref && (
                            <p><strong>Division:</strong> {officialPerson.DivisionPref}</p>
                        )}
                        {fields.map(field => {
                            const value = person.Fields?.[field.Id];
                            if (!value) return null;
                            return (
                                <p key={field.Id}><strong>{field.Label}:</strong> {value}</p>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

/** Summary card for mobile totals */
function TotalsCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="card card-compact bg-base-200 border border-base-300 mt-2">
            <div className="card-body p-3">
                <h4 className="card-title text-sm m-0">Totals</h4>
                <div className="flex flex-wrap gap-3 text-sm">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default function EventRegistrationsPage({ }: Props) {
    const {
        context,
        summary: initialSummary
    } = useOutletContext<EventSummaryProviderContext>();

    const { auth, eventId } = context;

    const [summary, setSummary] = useState<EventSummary>(initialSummary);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);

    const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>({
        churches: true,
        teams: true,
        quizzersAndCoaches: true,
        officials: true,
        attendees: true,
    });

    const [highlightDate, setHighlightDate] = useState<Date | null>(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    });

    const toggleSection = (section: keyof SectionVisibility) => {
        setSectionVisibility(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleRemoveBlanks = async () => {
        setIsRefreshing(true);
        try {
            const refreshed = await EventsService.getEventSummary(auth, eventId, undefined, true);
            setSummary(refreshed);
        } catch (error) {
            console.error("Failed to refresh summary:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleDownloadExcel = async () => {
        setIsDownloading("excel");
        try {
            await EventsService.downloadExcelReport(auth, eventId);
        } catch (error) {
            console.error("Failed to download Excel report:", error);
        } finally {
            setIsDownloading(null);
        }
    };

    const handleDownloadScoreKeep = async () => {
        setIsDownloading("scorekeep");
        try {
            await EventsService.downloadScoreKeepFile(auth, eventId);
        } catch (error) {
            console.error("Failed to download ScoreKeep file:", error);
        } finally {
            setIsDownloading(null);
        }
    };

    const handleEditChurch = (churchId: string) => {
        window.location.href = `/#/register/${eventId}/${churchId}`;
    };

    // Calculate totals
    const churchTotals = {
        coaches: summary.Churches.reduce((sum, c) => sum + c.CoachNames.length, 0),
        officials: summary.Churches.reduce((sum, c) => sum + c.OfficialCount, 0),
        teams: summary.Churches.reduce((sum, c) => sum + c.TeamCount, 0),
        payment: summary.Churches.reduce((sum, c) => sum + c.CalculatedPayment, 0),
        balance: summary.Churches.reduce((sum, c) => sum + Math.max(0, c.PaymentBalance), 0),
    };

    const divisionTotals: { [id: string]: number } = {};
    if (summary.TeamDivisions) {
        for (const div of summary.TeamDivisions) {
            divisionTotals[div.Id] = summary.Churches.reduce((sum, c) => sum + (c.Divisions?.[div.Id] ?? 0), 0);
        }
    }

    const quizzersCount = summary.QuizzersAndCoaches.filter(
        p => p.Role === PersonRole.Quizzer || p.Role === PersonRole.QuizzerWithoutTeam
    ).length;
    const coachesCount = summary.QuizzersAndCoaches.filter(p => p.Role === PersonRole.Coach).length;
    const quizzersPaymentTotal = summary.QuizzersAndCoaches.reduce((sum, p) => sum + p.CalculatedPayment, 0);

    const officialsPaymentTotal = summary.Officials.reduce((sum, p) => sum + p.CalculatedPayment, 0);
    const attendeesPaymentTotal = summary.Attendees?.reduce((sum, p) => sum + p.CalculatedPayment, 0) ?? 0;

    const hasAttendees = summary.Attendees !== null && summary.Attendees !== undefined;

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div>
                <p className="text-sm text-base-content/70 m-0">
                    <b>Last Refreshed:</b> {DataTypeHelpers.formatDate(summary.RefreshDate, "MMM d, yyyy")}
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-0">
                <button
                    type="button"
                    className="btn btn-primary btn-sm mt-0 mb-0"
                    onClick={handleDownloadExcel}
                    disabled={isDownloading !== null}
                >
                    {isDownloading === "excel" ? (
                        <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                        <FontAwesomeIcon icon="fas faFileExcel" />
                    )}
                    Download Excel Report
                </button>
                <button
                    type="button"
                    className="btn btn-primary btn-sm mt-0 mb-0"
                    onClick={handleDownloadScoreKeep}
                    disabled={isDownloading !== null}
                >
                    {isDownloading === "scorekeep" ? (
                        <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                        <FontAwesomeIcon icon="fas faDatabase" />
                    )}
                    Download ScoreKeep File
                </button>
                <button
                    type="button"
                    className="btn btn-outline btn-sm mt-0 mb-0"
                    onClick={handleRemoveBlanks}
                    disabled={isRefreshing}
                >
                    {isRefreshing ? (
                        <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                        <FontAwesomeIcon icon="fas faRotate" />
                    )}
                    Remove Blanks
                </button>
            </div>

            {/* Section Toggles & Highlight Date */}
            <div className="flex flex-wrap gap-2 items-center mt-0 mb-0">
                <label className="btn btn-sm btn-outline m-0">
                    <input
                        type="checkbox"
                        className="checkbox checkbox-xs mr-1"
                        checked={sectionVisibility.churches}
                        onChange={() => toggleSection("churches")}
                    />
                    Churches
                </label>
                <label className="btn btn-sm btn-outline m-0">
                    <input
                        type="checkbox"
                        className="checkbox checkbox-xs mr-1"
                        checked={sectionVisibility.teams}
                        onChange={() => toggleSection("teams")}
                    />
                    Teams
                </label>
                <label className="btn btn-sm btn-outline m-0">
                    <input
                        type="checkbox"
                        className="checkbox checkbox-xs mr-1"
                        checked={sectionVisibility.quizzersAndCoaches}
                        onChange={() => toggleSection("quizzersAndCoaches")}
                    />
                    People
                </label>
                <label className="btn btn-sm btn-outline m-0">
                    <input
                        type="checkbox"
                        className="checkbox checkbox-xs mr-1"
                        checked={sectionVisibility.officials}
                        onChange={() => toggleSection("officials")}
                    />
                    Officials
                </label>
                {hasAttendees && (
                    <label className="btn btn-sm btn-outline m-0">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-xs mr-1"
                            checked={sectionVisibility.attendees}
                            onChange={() => toggleSection("attendees")}
                        />
                        Attendees
                    </label>
                )}

                <div className="flex items-center gap-2 ml-auto">
                    <span className="text-sm">Highlight changes since:</span>
                    <input
                        type="date"
                        className="input input-sm input-bordered w-40"
                        value={highlightDate ? formatDateForInput(highlightDate) : ""}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value) {
                                const date = new Date(value + "T00:00:00");
                                setHighlightDate(date);
                            } else {
                                setHighlightDate(null);
                            }
                        }}
                    />
                </div>
            </div>

            {/* Churches Section */}
            {sectionVisibility.churches && (
                <section className="mb-0 mt-0">
                    <h2 className="text-xl font-semibold mb-2 mt-0">
                        <FontAwesomeIcon icon="fas faChurch" classNames={["mr-2"]} />
                        Churches
                        <span className="badge badge-neutral ml-2">{summary.Churches.length}</span>
                    </h2>

                    {summary.Churches.length === 0 ? (
                        <p className="text-base-content/60 italic">No churches have registered for this event.</p>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="table table-zebra table-sm w-full">
                                    <thead>
                                        <tr>
                                            <th>Church</th>
                                            <th className="text-center">Coaches</th>
                                            <th className="text-center">Officials</th>
                                            {summary.TeamDivisions?.map(div => (
                                                <th key={div.Id} className="text-center">{div.Name}</th>
                                            ))}
                                            <th className="text-center">Teams</th>
                                            {summary.HasPayment && (
                                                <th className="text-center">
                                                    {summary.HasPaymentBalance ? "Owed" : "Payment"}
                                                </th>
                                            )}
                                            {summary.HasPaymentBalance && (
                                                <th className="text-center">Paid</th>
                                            )}
                                            <th className="text-center">Edit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.Churches.map(church => (
                                            <tr
                                                key={church.Id}
                                                className={isHighlighted(church.LastModified, highlightDate) ? "bg-warning/20" : ""}
                                            >
                                                <td>
                                                    <div className="font-medium mb-0">{church.ChurchName}</div>
                                                    <div className="text-xs text-base-content/70 mt-0">
                                                        {church.ChurchLocation.City}, {church.ChurchLocation.State}
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    {church.CoachNames.length > 0
                                                        ? church.CoachNames.map((n, i) => i > 0
                                                            ? <><br />{n}</>
                                                            : n)
                                                        : "None"}
                                                </td>
                                                <td className="text-center">{church.OfficialCount}</td>
                                                {summary.TeamDivisions?.map(div => (
                                                    <td key={div.Id} className="text-center">
                                                        {church.Divisions?.[div.Id] ?? 0}
                                                    </td>
                                                ))}
                                                <td className="text-center">{church.TeamCount}</td>
                                                {summary.HasPayment && (
                                                    <td className="text-center">{formatPayment(church.CalculatedPayment)}</td>
                                                )}
                                                {summary.HasPaymentBalance && (
                                                    <td className="text-center">{formatPayment(Math.max(0, church.PaymentBalance))}</td>
                                                )}
                                                <td className="text-center">
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary btn-xs"
                                                        onClick={() => handleEditChurch(church.Id)}
                                                    >
                                                        <FontAwesomeIcon icon="fas faPenToSquare" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="font-bold">
                                            <td>TOTALS</td>
                                            <td className="text-center">{churchTotals.coaches}</td>
                                            <td className="text-center">{churchTotals.officials}</td>
                                            {summary.TeamDivisions?.map(div => (
                                                <td key={div.Id} className="text-center">{divisionTotals[div.Id]}</td>
                                            ))}
                                            <td className="text-center">{churchTotals.teams}</td>
                                            {summary.HasPayment && (
                                                <td className="text-center">{formatPayment(churchTotals.payment)}</td>
                                            )}
                                            {summary.HasPaymentBalance && (
                                                <td className="text-center">{formatPayment(churchTotals.balance)}</td>
                                            )}
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden flex flex-col gap-2">
                                {summary.Churches.map(church => (
                                    <ChurchCard
                                        key={church.Id}
                                        church={church}
                                        summary={summary}
                                        isHighlighted={isHighlighted(church.LastModified, highlightDate)}
                                        onEdit={() => handleEditChurch(church.Id)}
                                    />
                                ))}
                                <TotalsCard>
                                    <span><strong>Churches:</strong> {summary.Churches.length}</span>
                                    <span><strong>Teams:</strong> {churchTotals.teams}</span>
                                    <span><strong>Coaches:</strong> {churchTotals.coaches}</span>
                                    {summary.HasPayment && (
                                        <span><strong>Payment:</strong> {formatPayment(churchTotals.payment)}</span>
                                    )}
                                </TotalsCard>
                            </div>
                        </>
                    )}
                </section>
            )}

            {/* Teams Section */}
            {sectionVisibility.teams && (
                <section className="mb-0 mt-0">
                    <h2 className="text-xl font-semibold mb-2 mt-0">
                        <FontAwesomeIcon icon="fas faPeopleGroup" classNames={["mr-2"]} />
                        Teams
                        <span className="badge badge-neutral ml-2">{summary.Teams.length}</span>
                    </h2>

                    {summary.TeamDivisions ? (
                        // Render by division
                        summary.TeamDivisions.map(division => (
                            <div key={division.Id} className="mb-4">
                                <h3 className="text-lg font-medium mb-2 mt-0 italic">{division.Name} Division</h3>
                                {renderTeamsTable(division.Teams, summary, highlightDate)}
                            </div>
                        ))
                    ) : (
                        // Render all teams together
                        renderTeamsTable(summary.Teams, summary, highlightDate)
                    )}
                </section>
            )}

            {/* Quizzers & Coaches Section */}
            {sectionVisibility.quizzersAndCoaches && (
                <section className="mb-0 mt-0">
                    <h2 className="text-xl font-semibold mb-2 mt-0">
                        <FontAwesomeIcon icon="fas faUsers" classNames={["mr-2"]} />
                        Quizzers & Coaches
                        <span className="badge badge-neutral ml-2">{summary.QuizzersAndCoaches.length}</span>
                    </h2>

                    {summary.QuizzersAndCoaches.length === 0 ? (
                        <p className="text-base-content/60 italic">No quizzers or coaches have registered for this event.</p>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="table table-zebra table-sm w-full">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Role</th>
                                            <th>Team</th>
                                            <th>Church</th>
                                            <th>E-mail</th>
                                            {summary.HasPayment && <th className="text-center">Payment</th>}
                                            {summary.QuizzerAndCoachFields.map(field => (
                                                <th key={field.Id} className="text-center">{field.Label}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.QuizzersAndCoaches.map(person => (
                                            <tr
                                                key={person.Id}
                                                className={isHighlighted(person.LastModified, highlightDate) ? "bg-warning/20" : ""}
                                            >
                                                <td>{person.PersonName}</td>
                                                <td>{PersonRole[person.Role]}</td>
                                                <td>{person.TeamName}</td>
                                                <td>{person.ChurchName}</td>
                                                <td>{person.Email}</td>
                                                {summary.HasPayment && (
                                                    <td className="text-center">{formatPayment(person.CalculatedPayment)}</td>
                                                )}
                                                {summary.QuizzerAndCoachFields.map(field => (
                                                    <td key={field.Id} className="text-center">
                                                        {renderFieldValue(field, person.Fields?.[field.Id])}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="font-bold">
                                            <td>TOTALS</td>
                                            <td>Coaches: {coachesCount}<br />Quizzers: {quizzersCount}</td>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                            {summary.HasPayment && (
                                                <td className="text-center">{formatPayment(quizzersPaymentTotal)}</td>
                                            )}
                                            {summary.QuizzerAndCoachFields.map(field => (
                                                <td key={field.Id} className="text-center">
                                                    {calculateFieldTotal(field, summary.QuizzersAndCoaches)}
                                                </td>
                                            ))}
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden flex flex-col gap-2">
                                {summary.QuizzersAndCoaches.map(person => (
                                    <PersonCard
                                        key={person.Id}
                                        person={person}
                                        fields={summary.QuizzerAndCoachFields}
                                        isHighlighted={isHighlighted(person.LastModified, highlightDate)}
                                        showTeam={true}
                                    />
                                ))}
                                <TotalsCard>
                                    <span><strong>Quizzers:</strong> {quizzersCount}</span>
                                    <span><strong>Coaches:</strong> {coachesCount}</span>
                                    {summary.HasPayment && (
                                        <span><strong>Payment:</strong> {formatPayment(quizzersPaymentTotal)}</span>
                                    )}
                                </TotalsCard>
                            </div>
                        </>
                    )}
                </section>
            )}

            {/* Officials Section */}
            {sectionVisibility.officials && (
                <section className="mb-0 mt-0">
                    <h2 className="text-xl font-semibold mb-2 mt-0">
                        <FontAwesomeIcon icon="fas faUserTie" classNames={["mr-2"]} />
                        Officials
                        <span className="badge badge-neutral ml-2">{summary.Officials.length}</span>
                    </h2>

                    {summary.Officials.length === 0 ? (
                        <p className="text-base-content/60 italic">No officials have registered for this event.</p>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="table table-zebra table-sm w-full">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Church</th>
                                            <th>E-mail</th>
                                            {summary.TeamDivisions && summary.TeamDivisions.length > 0 && (
                                                <th>Division</th>
                                            )}
                                            <th className="text-center">Quizmaster</th>
                                            {summary.HasJudges && <th className="text-center">Judge</th>}
                                            {summary.HasScorekeepers && <th className="text-center">Scorekeeper</th>}
                                            {summary.HasTimekeepers && <th className="text-center">Timekeeper</th>}
                                            {summary.HasPayment && <th className="text-center">Payment</th>}
                                            {summary.OfficialFields.map(field => (
                                                <th key={field.Id} className="text-center">{field.Label}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.Officials.map(official => (
                                            <tr
                                                key={official.Id}
                                                className={isHighlighted(official.LastModified, highlightDate) ? "bg-warning/20" : ""}
                                            >
                                                <td>{official.PersonName}</td>
                                                <td>{official.ChurchName}</td>
                                                <td>{official.Email}</td>
                                                {summary.TeamDivisions && summary.TeamDivisions.length > 0 && (
                                                    <td>{official.DivisionPref || "—"}</td>
                                                )}
                                                <td className="text-center">
                                                    {official.QuizmasterPref ? renderRolePreference(official.QuizmasterPref) : "—"}
                                                </td>
                                                {summary.HasJudges && (
                                                    <td className="text-center">
                                                        {official.JudgePref ? renderRolePreference(official.JudgePref) : "—"}
                                                    </td>
                                                )}
                                                {summary.HasScorekeepers && (
                                                    <td className="text-center">
                                                        {official.ScorekeeperPref ? renderRolePreference(official.ScorekeeperPref) : "—"}
                                                    </td>
                                                )}
                                                {summary.HasTimekeepers && (
                                                    <td className="text-center">
                                                        {official.TimekeeperPref ? renderRolePreference(official.TimekeeperPref) : "—"}
                                                    </td>
                                                )}
                                                {summary.HasPayment && (
                                                    <td className="text-center">{formatPayment(official.CalculatedPayment)}</td>
                                                )}
                                                {summary.OfficialFields.map(field => (
                                                    <td key={field.Id} className="text-center">
                                                        {renderFieldValue(field, official.Fields?.[field.Id])}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="font-bold">
                                            <td>TOTALS</td>
                                            <td></td>
                                            <td></td>
                                            {summary.TeamDivisions && summary.TeamDivisions.length > 0 && <td></td>}
                                            <td className="text-center">
                                                {summary.Officials.filter(o => o.QuizmasterPref).length}
                                            </td>
                                            {summary.HasJudges && (
                                                <td className="text-center">
                                                    {summary.Officials.filter(o => o.JudgePref).length}
                                                </td>
                                            )}
                                            {summary.HasScorekeepers && (
                                                <td className="text-center">
                                                    {summary.Officials.filter(o => o.ScorekeeperPref).length}
                                                </td>
                                            )}
                                            {summary.HasTimekeepers && (
                                                <td className="text-center">
                                                    {summary.Officials.filter(o => o.TimekeeperPref).length}
                                                </td>
                                            )}
                                            {summary.HasPayment && (
                                                <td className="text-center">{formatPayment(officialsPaymentTotal)}</td>
                                            )}
                                            {summary.OfficialFields.map(field => (
                                                <td key={field.Id} className="text-center">
                                                    {calculateFieldTotal(field, summary.Officials)}
                                                </td>
                                            ))}
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden flex flex-col gap-2">
                                {summary.Officials.map(official => (
                                    <PersonCard
                                        key={official.Id}
                                        person={official}
                                        fields={summary.OfficialFields}
                                        isHighlighted={isHighlighted(official.LastModified, highlightDate)}
                                        showRolePreferences={true}
                                    />
                                ))}
                                <TotalsCard>
                                    <span><strong>Officials:</strong> {summary.Officials.length}</span>
                                    <span><strong>QM:</strong> {summary.Officials.filter(o => o.QuizmasterPref).length}</span>
                                    {summary.HasJudges && (
                                        <span><strong>Judge:</strong> {summary.Officials.filter(o => o.JudgePref).length}</span>
                                    )}
                                    {summary.HasPayment && (
                                        <span><strong>Payment:</strong> {formatPayment(officialsPaymentTotal)}</span>
                                    )}
                                </TotalsCard>
                            </div>
                        </>
                    )}
                </section>
            )}

            {/* Attendees Section */}
            {hasAttendees && sectionVisibility.attendees && (
                <section className="mb-0 mt-0">
                    <h2 className="text-xl font-semibold mb-2 mt-0">
                        <FontAwesomeIcon icon="fas faUserGroup" classNames={["mr-2"]} />
                        Attendees
                        <span className="badge badge-neutral ml-2">{summary.Attendees!.length}</span>
                    </h2>

                    {summary.Attendees!.length === 0 ? (
                        <p className="text-base-content/60 italic">No attendees have registered for this event.</p>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="table table-zebra table-sm w-full">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Church</th>
                                            <th>E-mail</th>
                                            {summary.HasPayment && <th className="text-center">Payment</th>}
                                            {summary.AttendeeFields.map(field => (
                                                <th key={field.Id} className="text-center">{field.Label}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.Attendees!.map(attendee => (
                                            <tr
                                                key={attendee.Id}
                                                className={isHighlighted(attendee.LastModified, highlightDate) ? "bg-warning/20" : ""}
                                            >
                                                <td>{attendee.PersonName}</td>
                                                <td>{attendee.ChurchName}</td>
                                                <td>{attendee.Email}</td>
                                                {summary.HasPayment && (
                                                    <td className="text-center">{formatPayment(attendee.CalculatedPayment)}</td>
                                                )}
                                                {summary.AttendeeFields.map(field => (
                                                    <td key={field.Id} className="text-center">
                                                        {renderFieldValue(field, attendee.Fields?.[field.Id])}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="font-bold">
                                            <td>TOTALS</td>
                                            <td></td>
                                            <td></td>
                                            {summary.HasPayment && (
                                                <td className="text-center">{formatPayment(attendeesPaymentTotal)}</td>
                                            )}
                                            {summary.AttendeeFields.map(field => (
                                                <td key={field.Id} className="text-center">
                                                    {calculateFieldTotal(field, summary.Attendees!)}
                                                </td>
                                            ))}
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden flex flex-col gap-2">
                                {summary.Attendees!.map(attendee => (
                                    <PersonCard
                                        key={attendee.Id}
                                        person={attendee}
                                        fields={summary.AttendeeFields}
                                        isHighlighted={isHighlighted(attendee.LastModified, highlightDate)}
                                    />
                                ))}
                                <TotalsCard>
                                    <span><strong>Attendees:</strong> {summary.Attendees!.length}</span>
                                    {summary.HasPayment && (
                                        <span><strong>Payment:</strong> {formatPayment(attendeesPaymentTotal)}</span>
                                    )}
                                </TotalsCard>
                            </div>
                        </>
                    )}
                </section>
            )}
        </div>
    );
}

/** Render role preference ordinal */
function renderRolePreference(preference: number): string {
    switch (preference) {
        case 1: return "1st";
        case 2: return "2nd";
        case 3: return "3rd";
        case 4: return "4th";
        default: return `${preference}th`;
    }
}

/** Render teams table (used for both undivided and by-division) */
function renderTeamsTable(
    teams: EventTeamSummary[],
    summary: EventSummary,
    highlightDate: Date | null
): React.ReactNode {
    if (teams.length === 0) {
        return <p className="text-base-content/60 italic">No teams have registered for this event / division.</p>;
    }

    const teamPaymentTotal = teams.reduce((sum, t) => sum + t.CalculatedPayment, 0);
    const contactsTotal = teams.filter(t => t.PointOfContact).length;
    const quizzersTotal = teams.reduce((sum, t) =>
        sum + (t.People?.filter(p => p.Role === PersonRole.Quizzer || p.Role === PersonRole.QuizzerWithoutTeam).length ?? 0), 0);
    const coachesTotal = teams.reduce((sum, t) =>
        sum + (t.People?.filter(p => p.Role === PersonRole.Coach).length ?? 0), 0);

    return (
        <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="table table-zebra table-sm w-full">
                    <thead>
                        <tr>
                            <th>Team</th>
                            <th>Contact</th>
                            {summary.TeamFields.map(field => (
                                <th key={field.Id} className="text-center">{field.Label}</th>
                            ))}
                            <th className="text-center">Quizzers</th>
                            <th className="text-center">Coaches</th>
                            {summary.HasPayment && <th className="text-center">Payment</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {teams.map(team => {
                            const quizzers = team.People?.filter(p => p.Role === PersonRole.Quizzer || p.Role === PersonRole.QuizzerWithoutTeam) ?? [];
                            const coaches = team.People?.filter(p => p.Role === PersonRole.Coach) ?? [];

                            return (
                                <tr
                                    key={team.Id}
                                    className={isHighlighted(team.LastModified, highlightDate) ? "bg-warning/20" : ""}
                                >
                                    <td>
                                        <div className="font-medium mb-0">{team.Name}</div>
                                        <div className="text-xs text-base-content/70 mt-0">
                                            {team.ChurchName} ({team.ChurchLocation.City}, {team.ChurchLocation.State})
                                        </div>
                                    </td>
                                    <td>
                                        {team.PointOfContact ? (
                                            <>
                                                <div className="mb-0">{team.PointOfContact.FirstName} {team.PointOfContact.LastName}</div>
                                                {team.PointOfContact.PhoneNumber && (
                                                    <div className="text-xs text-base-content/70 mt-0">{team.PointOfContact.PhoneNumber}</div>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-base-content/30">—</span>
                                        )}
                                    </td>
                                    {summary.TeamFields.map(field => (
                                        <td key={field.Id} className="text-center">
                                            {renderFieldValue(field, team.Fields?.[field.Id])}
                                        </td>
                                    ))}
                                    <td className="text-center">
                                        {quizzers.length > 0
                                            ? quizzers.map((p, i) => i > 0
                                                ? <><br />{p.PersonName}</>
                                                : p.PersonName)
                                            : "—"}
                                    </td>
                                    <td className="text-center">
                                        {coaches.length > 0
                                            ? coaches.map((p, i) => i > 0
                                                ? <><br />{p.PersonName}</>
                                                : p.PersonName)
                                            : "—"}
                                    </td>
                                    {summary.HasPayment && (
                                        <td className="text-center">{formatPayment(team.CalculatedPayment)}</td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="font-bold">
                            <td>TOTALS</td>
                            <td className="text-center">{contactsTotal}</td>
                            {summary.TeamFields.map(field => (
                                <td key={field.Id} className="text-center">
                                    {calculateFieldTotal(field, teams)}
                                </td>
                            ))}
                            <td className="text-center">{quizzersTotal}</td>
                            <td className="text-center">{coachesTotal}</td>
                            {summary.HasPayment && (
                                <td className="text-center">{formatPayment(teamPaymentTotal)}</td>
                            )}
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col gap-2">
                {teams.map(team => (
                    <TeamCard
                        key={team.Id}
                        team={team}
                        summary={summary}
                        isHighlighted={isHighlighted(team.LastModified, highlightDate)}
                    />
                ))}
                <TotalsCard>
                    <span><strong>Teams:</strong> {teams.length}</span>
                    <span><strong>Quizzers:</strong> {quizzersTotal}</span>
                    <span><strong>Coaches:</strong> {coachesTotal}</span>
                    {summary.HasPayment && (
                        <span><strong>Payment:</strong> {formatPayment(teamPaymentTotal)}</span>
                    )}
                </TotalsCard>
            </div>
        </>
    );
}