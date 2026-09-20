import { useEffect, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import type { RegistrationProviderContext } from "./RegistrationProvider";
import RegistrationReceipt from "./RegistrationReceipt";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { RegistrationService } from "types/services/RegistrationService";
import {
    EventsService,
    type EventChurchSummary,
    type EventSummary,
    type PaymentEntry,
} from "types/services/EventsService";

export default function RegistrationReceiptPage() {
    const { auth, eventId, church, isEditable } = useOutletContext<RegistrationProviderContext>();
    const [searchParams] = useSearchParams();

    // Set by the return URL handed to the payment processor, so this is the landing after a checkout.
    const isReturningFromPayment = searchParams.get("paid") === "1";

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [eventSummary, setEventSummary] = useState<EventSummary | null>(null);
    const [churchSummary, setChurchSummary] = useState<EventChurchSummary | null>(null);

    useEffect(() => {
        if (!church?.Id) {
            setIsLoading(false);
            setError("No church selected.");
            return;
        }

        const churchId = church.Id;

        setIsLoading(true);
        setError(null);

        // Reconcile first when returning from checkout, otherwise the charge that was just completed still
        // shows as a pending balance until the server's periodic reconciliation catches up.
        const reconciled = isReturningFromPayment
            ? RegistrationService.reconcilePayments(auth, eventId, churchId).catch(() => {
                // The periodic reconciliation is the backstop, so a failure here only costs a stale balance.
                // Don't block the receipt on it.
            })
            : Promise.resolve();

        reconciled
            .then(() => EventsService.getEventSummary(auth, eventId, churchId))
            .then(summary => {
                setEventSummary(summary);
                const matchingChurch = summary.Churches?.find(c => c.Id === churchId) ?? null;
                setChurchSummary(matchingChurch);
                setIsLoading(false);
            })
            .catch(err => {
                setError(err?.message || "An error occurred loading the receipt.");
                setIsLoading(false);
            });
    }, [auth, eventId, church?.Id, isReturningFromPayment]);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 py-8 justify-center">
                <span className="loading loading-spinner loading-lg"></span>
                <span>Loading receipt...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div role="alert" className="alert alert-error">
                <FontAwesomeIcon icon="fas faTriangleExclamation" />
                <span>{error}</span>
            </div>
        );
    }

    if (!eventSummary || !churchSummary) {
        return (
            <div role="alert" className="alert alert-warning">
                <FontAwesomeIcon icon="fas faCircleExclamation" />
                <span>No receipt data available for this registration.</span>
            </div>
        );
    }

    const entries: PaymentEntry[] = churchSummary.PaymentEntries ?? [];

    return (
        <div className="flex flex-col gap-4">
            {/* Back link */}
            <a
                href={`#/${eventId}/${church!.Id}`}
                className="btn btn-ghost btn-sm m-0 self-start"
            >
                <FontAwesomeIcon icon="fas faArrowLeft" classNames={["mr-1"]} />
                Back to Registration
            </a>

            <RegistrationReceipt
                eventSummary={eventSummary}
                churchSummary={churchSummary}
                entries={entries}
                isEditable={isEditable}
                includeDetails
                editEntry={() => { /* TODO: payment entry editing */ }}
            />
        </div>
    );
}
