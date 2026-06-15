import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { RegistrationProviderContext } from "./RegistrationProvider";
import RegistrationReceipt from "./RegistrationReceipt";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import {
    EventsService,
    type EventChurchSummary,
    type EventSummary,
    type PaymentEntry,
} from "types/services/EventsService";

export default function RegistrationReceiptPage() {
    const { auth, eventId, church, isEditable } = useOutletContext<RegistrationProviderContext>();

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

        setIsLoading(true);
        setError(null);

        EventsService.getEventSummary(auth, eventId, church.Id)
            .then(summary => {
                setEventSummary(summary);
                const matchingChurch = summary.Churches?.find(c => c.Id === church!.Id) ?? null;
                setChurchSummary(matchingChurch);
                setIsLoading(false);
            })
            .catch(err => {
                setError(err?.message || "An error occurred loading the receipt.");
                setIsLoading(false);
            });
    }, [auth, eventId, church?.Id]);

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
