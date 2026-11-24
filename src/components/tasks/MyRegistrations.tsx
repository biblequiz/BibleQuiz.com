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

/** Requests allowed in flight at once, so a person with several churches doesn't flood the API. */
const MAX_CONCURRENT_REQUESTS = 6;

interface LoadState {
    isLoading: boolean;
    failedCount: number;
    registrations: Registration[];
}

/**
 * My registrations (D29): the signed-in person's church registrations for events that haven't ended, each
 * opening the existing registration screen.
 *
 * It asks for each church's registration in each upcoming event (`GET /api/Registration?eid=&cid=`, which church
 * administrators can already call) rather than listing everything a church ever registered for: that route
 * recalculates and saves costs when an event's pricing has changed, and past events must not be touched just by
 * viewing this page.
 */
export default function MyRegistrations({ eventEndDates }: Props) {
    const auth = AuthManager.useNanoStore();
    const profile = auth.userProfile;

    const churchIds = profile?.churchPermissions ? [...profile.churchPermissions].sort() : [];
    const churchKey = churchIds.join(",");

    const [state, setState] = useState<LoadState>({ isLoading: true, failedCount: 0, registrations: [] });

    useEffect(() => {
        const upcomingEventIds = getUpcomingEventIds(eventEndDates);
        if (churchIds.length === 0 || upcomingEventIds.length === 0) {
            setState({ isLoading: false, failedCount: 0, registrations: [] });
            return;
        }

        let isCancelled = false;
        setState({ isLoading: true, failedCount: 0, registrations: [] });

        const requests = churchIds.flatMap(churchId => upcomingEventIds.map(eventId =>
            () => RegistrationService.getRegistrations(auth, 1, 0, eventId, churchId)));

        runWithLimit(requests, MAX_CONCURRENT_REQUESTS).then(results => {
            if (isCancelled) {
                return;
            }

            const registrations: Registration[] = [];
            let failedCount = 0;
            for (const result of results) {
                if (result.status === "fulfilled") {
                    registrations.push(...result.value.Items);
                }
                else {
                    failedCount++;
                }
            }

            // Soonest first.
            const endTime = (r: Registration) =>
                DataTypeHelpers.parseDateOnly(eventEndDates[r.EventId] ?? null)?.getTime() ?? 0;
            registrations.sort((a, b) => endTime(a) - endTime(b));

            setState({ isLoading: false, failedCount, registrations });
        });

        return () => { isCancelled = true; };
    }, [churchKey, eventEndDates]);

    if (!profile) {
        if (auth.isRetrievingProfile) {
            return <Loading />;
        }

        return <NotAuthenticatedSection />;
    }

    if (churchIds.length === 0) {
        const hasWiderPermissions = !!profile.organizationPermission ||
            Object.keys(profile.regionPermissions ?? {}).length > 0 ||
            Object.keys(profile.districtPermissions ?? {}).length > 0;

        return (
            <div className="bq-empty">
                <p>
                    {hasWiderPermissions
                        ? "This page lists churches you're an administrator for directly, and you aren't one for any church. Registrations for your district or region are in Manage events."
                        : "You don't manage registrations for a church yet. When you register your church for an event, it shows up here."}
                </p>
                <a className="btn btn-primary" href={hasWiderPermissions ? "/manage-events/" : "/events/#registration-open"}>
                    <FontAwesomeIcon icon={hasWiderPermissions ? "fas faCalendarCheck" : "fas faPenToSquare"} />
                    {hasWiderPermissions ? "Go to Manage events" : "Find an event to register for"}
                </a>
            </div>);
    }

    if (state.isLoading) {
        return <Loading />;
    }

    return (
        <div className="bq-my-registrations">
            {state.failedCount > 0 && (
                <div role="alert" className="alert alert-warning mb-4">
                    <FontAwesomeIcon icon="fas faTriangleExclamation" />
                    <span>
                        Some registrations couldn't be loaded. Reload the page to try again.
                    </span>
                </div>)}
            <section>
                <h2>Upcoming <span className="bq-count">({state.registrations.length})</span></h2>
                {state.registrations.length > 0
                    ? <RegistrationList registrations={state.registrations} />
                    : (
                        <p>
                            No registrations for upcoming events.{" "}
                            <a href="/events/#registration-open">See events open for registration</a>.
                        </p>)}
                <p className="bq-my-registrations-note">
                    Past registrations stay on each church's registration page. A new event can take a few hours
                    to appear here.
                </p>
            </section>
        </div>);
}

/**
 * Gets the events that haven't ended: an event is upcoming through the end of its last day.
 */
function getUpcomingEventIds(eventEndDates: Record<string, string>): string[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Object.entries(eventEndDates)
        .filter(([, endDate]) => {
            const date = DataTypeHelpers.parseDateOnly(endDate);
            return date !== null && date >= today;
        })
        .map(([id]) => id);
}

/**
 * Runs the requests with at most `limit` in flight, keeping each result in order.
 */
async function runWithLimit<T>(requests: (() => Promise<T>)[], limit: number): Promise<PromiseSettledResult<T>[]> {
    const results: PromiseSettledResult<T>[] = new Array(requests.length);
    let next = 0;

    async function worker() {
        while (next < requests.length) {
            const index = next++;
            try {
                results[index] = { status: "fulfilled", value: await requests[index]() };
            }
            catch (reason) {
                results[index] = { status: "rejected", reason };
            }
        }
    }

    await Promise.all(Array.from({ length: Math.min(limit, requests.length) }, worker));
    return results;
}

function Loading() {
    return (
        <div className="flex justify-center items-center gap-2 py-8">
            <span className="loading loading-spinner loading-lg" />
            Loading your registrations …
        </div>);
}

function RegistrationList({ registrations }: { registrations: Registration[] }) {
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
                            className="btn btn-sm btn-primary"
                            href={getRegistrationPath(registration.EventId, registration.ChurchId)}>
                            <FontAwesomeIcon icon="fas faPenToSquare" />
                            Open registration
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
