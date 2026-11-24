import { useEffect, useState } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import NotAuthenticatedSection from "components/auth/NotAuthenticatedSection";
import { AuthManager } from "types/AuthManager";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import { PersonRole } from "types/services/PeopleService";
import { RegistrationService, type Registration } from "types/services/RegistrationService";
import { getRegistrationPath } from "utils/RegistrationLinks";

interface Props {
    /** End date of each event in the public Event List data (this season and upcoming), by event id. */
    eventEndDates: Record<string, string>;
}

/**
 * Registrations each church holds, newest first. Older ones beyond this are reached from the church's
 * registration pages.
 */
const PAGE_SIZE = 20;

interface LoadState {
    isLoading: boolean;
    error: string | null;
    registrations: Registration[];
}

/**
 * My registrations (D29): every registration of the churches the signed-in person administers, split into
 * upcoming and past, each opening the existing registration screen.
 *
 * Uses the existing `GET /api/Registration?cid=` route, which church administrators can already call.
 */
export default function MyRegistrations({ eventEndDates }: Props) {
    const auth = AuthManager.useNanoStore();
    const profile = auth.userProfile;

    const churchIds = profile?.churchPermissions ? [...profile.churchPermissions].sort() : [];
    const churchKey = churchIds.join(",");

    const [state, setState] = useState<LoadState>({ isLoading: false, error: null, registrations: [] });

    useEffect(() => {
        if (churchIds.length === 0) {
            setState({ isLoading: false, error: null, registrations: [] });
            return;
        }

        let isCancelled = false;
        setState({ isLoading: true, error: null, registrations: [] });

        Promise.all(churchIds.map(churchId =>
            RegistrationService.getRegistrations(auth, PAGE_SIZE, 0, undefined, churchId)))
            .then(pages => {
                if (!isCancelled) {
                    setState({ isLoading: false, error: null, registrations: pages.flatMap(page => page.Items) });
                }
            })
            .catch(error => {
                if (!isCancelled) {
                    setState({
                        isLoading: false,
                        error: (error as Error)?.message || "Your registrations couldn't be loaded.",
                        registrations: [],
                    });
                }
            });

        return () => { isCancelled = true; };
    }, [churchKey]);

    if (!profile) {
        if (auth.isRetrievingProfile) {
            return <Loading />;
        }

        return <NotAuthenticatedSection />;
    }

    if (churchIds.length === 0) {
        return (
            <div className="bq-empty">
                <p>
                    You don't manage registrations for a church yet. When you register your church for an event,
                    it shows up here.
                </p>
                <a className="btn btn-primary" href="/events/#registration-open">
                    <FontAwesomeIcon icon="fas faPenToSquare" />
                    Find an event to register for
                </a>
            </div>);
    }

    if (state.isLoading) {
        return <Loading />;
    }

    if (state.error) {
        return (
            <div role="alert" className="alert alert-error">
                <FontAwesomeIcon icon="fas faTriangleExclamation" />
                <span>{state.error}</span>
            </div>);
    }

    // An event is upcoming through the end of its last day. Events missing from the public data (hidden, or
    // from earlier seasons) count as past.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isUpcoming = (registration: Registration) => {
        const endDate = DataTypeHelpers.parseDateOnly(eventEndDates[registration.EventId] ?? null);
        return endDate !== null && endDate >= today;
    };

    const upcoming = state.registrations.filter(isUpcoming);
    const past = state.registrations.filter(r => !isUpcoming(r));

    return (
        <div className="bq-my-registrations">
            <section>
                <h2>Upcoming <span className="bq-count">({upcoming.length})</span></h2>
                {upcoming.length > 0
                    ? <RegistrationList registrations={upcoming} isUpcoming={true} />
                    : (
                        <p>
                            No upcoming registrations.{" "}
                            <a href="/events/#registration-open">See events open for registration</a>.
                        </p>)}
            </section>
            {past.length > 0 && (
                <section>
                    <h2>Past <span className="bq-count">({past.length})</span></h2>
                    <RegistrationList registrations={past} isUpcoming={false} />
                </section>)}
        </div>);
}

function Loading() {
    return (
        <div className="flex justify-center items-center gap-2 py-8">
            <span className="loading loading-spinner loading-lg" />
            Loading your registrations …
        </div>);
}

function RegistrationList({ registrations, isUpcoming }: { registrations: Registration[]; isUpcoming: boolean }) {
    return (
        <div className="bq-event-grid">
            {registrations.map(registration => (
                <article key={`${registration.EventId}-${registration.ChurchId}`} className="bq-event">
                    <div className="bq-event-body">
                        <h3 className="bq-event-name">{registration.EventDescription}</h3>
                        <p className="bq-event-meta">
                            <FontAwesomeIcon icon="fas faChurch" />
                            <span>
                                {registration.ChurchName}
                                {registration.ChurchLocation ? `, ${registration.ChurchLocation}` : ""}
                            </span>
                        </p>
                        <p className="bq-event-meta">
                            <FontAwesomeIcon icon="fas faUserGroup" />
                            <span>{describeCounts(registration)}</span>
                        </p>
                    </div>
                    <div className="bq-event-actions">
                        <a
                            className={`btn btn-sm ${isUpcoming ? "btn-primary" : "btn-outline"}`}
                            href={getRegistrationPath(registration.EventId, registration.ChurchId)}>
                            <FontAwesomeIcon icon={`fas ${isUpcoming ? "faPenToSquare" : "faEye"}`} />
                            {isUpcoming ? "Open registration" : "View registration"}
                        </a>
                    </div>
                </article>))}
        </div>);
}

/**
 * Summarizes who is registered, e.g. "2 teams · 9 quizzers · 1 official".
 */
function describeCounts(registration: Registration): string {
    const teams = registration.Teams ?? [];
    const quizzers = teams
        .flatMap(team => team.People ?? [])
        .filter(person => person.Role === PersonRole.Quizzer)
        .length + (registration.Individuals?.length ?? 0);
    const officials = registration.Officials?.length ?? 0;

    const parts = [
        plural(teams.length, "team"),
        plural(quizzers, "quizzer"),
    ];

    if (officials > 0) {
        parts.push(plural(officials, "official"));
    }

    return parts.join(" · ");
}

function plural(count: number, noun: string): string {
    return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
