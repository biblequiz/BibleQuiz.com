import FontAwesomeIcon from "components/FontAwesomeIcon";
import { EventRegistrationStatus, type EventInfo } from "types/services/EventsService";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

interface Props {
    event: EventInfo;
}

export default function RegistrationBanner({ event }: Props) {

    const status = event.RegistrationStatus;

    if (status === EventRegistrationStatus.Open) {
        return null;
    }

    let message: string;
    let alertClass: string;
    let icon: string;

    switch (status) {
        case EventRegistrationStatus.AlreadyClosed:
            message = `Registration for this event closed on ${DataTypeHelpers.formatDate(event.RegistrationEndDate) ?? "a previous date"}.`;
            alertClass = "alert-warning";
            icon = "fas faLock";
            break;
        case EventRegistrationStatus.FutureOpen:
            message = `Registration opens on ${DataTypeHelpers.formatDate(event.RegistrationStartDate) ?? "a future date"}.`;
            alertClass = "alert-info";
            icon = "fas faClockRotateLeft";
            break;
        case EventRegistrationStatus.OpenWithRestrictions:
            message = "Registration is open with restrictions. Some sections may not be editable.";
            alertClass = "alert-warning";
            icon = "fas faTriangleExclamation";
            break;
        default:
            return null;
    }

    return (
        <div role="alert" className={`alert ${alertClass} mb-2`}>
            <FontAwesomeIcon icon={icon} />
            <span>{message}</span>
        </div>
    );
}
