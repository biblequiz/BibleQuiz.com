import FontAwesomeIcon from "../FontAwesomeIcon";
import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState } from "utils/SharedState";

interface Props {
    eventId: string;
}

export default function EventRegistrationBanner({ eventId }: Props) {

    const reportState = useStore(sharedEventScoringReportState);
    if (!reportState) {
        return null;
    }

    return (
        <div role="alert" className="alert alert-info alert-outline mb-4">
            <div className="text-base-content">
                <p className="mb-2">
                    You can still register for this event by clicking the Register button below.
                </p>
                <a
                    className="btn btn-secondary btn-sm"
                    href={`https://registration.biblequiz.com/#/Registration/${eventId}`}
                    target="_blank">
                    <FontAwesomeIcon icon="fas faPenToSquare" />&nbsp;Register for this Event
                </a>
            </div>
        </div>);
};
