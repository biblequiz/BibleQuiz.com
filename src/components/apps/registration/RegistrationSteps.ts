import type { EventInfo } from "types/services/EventsService";
import type { Registration } from "types/services/RegistrationService";

/**
 * The steps of a registration (R1 in docs/task-navigation-plan.md). Each one is a screen of its own in the
 * guided flow and a card on the summary screen.
 */
export type RegistrationStepId = "church" | "teams" | "individuals" | "officials" | "attendees" | "forms" | "review";

export interface RegistrationStep {
    id: RegistrationStepId;
    label: string;
    icon: string;
}

/**
 * Gets the steps this event uses, in order. Steps the event doesn't use don't appear.
 *
 * @param event Event being registered for.
 * @param registration Church's registration (if loaded).
 * @param includeChurch Whether choosing the church is a step: it's skipped when the person administers exactly one
 * church, which is then preselected (R2).
 */
export function getRegistrationSteps(
    event: EventInfo,
    registration: Registration | null,
    includeChurch: boolean): RegistrationStep[] {

    const steps: RegistrationStep[] = [];

    if (includeChurch) {
        steps.push({ id: "church", label: "Church", icon: "fas faChurch" });
    }

    if (event.MaxTeamMembers > 0 || (registration?.Teams?.length ?? 0) > 0) {
        steps.push({ id: "teams", label: "Teams", icon: "fas faPeopleGroup" });
    }

    if (event.AllowIndividuals || (registration?.Individuals?.length ?? 0) > 0) {
        steps.push({ id: "individuals", label: "Individual quizzers", icon: "fas faPerson" });
    }

    steps.push({ id: "officials", label: "Officials", icon: "fas faUserTie" });

    if (event.AllowAttendees || (registration?.Attendees?.length ?? 0) > 0) {
        steps.push({ id: "attendees", label: "Attendees", icon: "fas faUsers" });
    }

    if ((registration?.Forms?.length ?? 0) > 0) {
        steps.push({ id: "forms", label: "Forms", icon: "fas faFileLines" });
    }

    steps.push({
        id: "review",
        label: event.CalculatePayment || event.TrackPayments ? "Review & pay" : "Review",
        icon: "fas faClipboardCheck",
    });

    return steps;
}

/**
 * Gets the address of a step.
 */
export function getStepPath(eventId: string, churchId: string | null | undefined, step: RegistrationStepId): string {
    return step === "church" || !churchId
        ? `#/${eventId}?choose=1`
        : `#/${eventId}/${churchId}/step/${step}`;
}
