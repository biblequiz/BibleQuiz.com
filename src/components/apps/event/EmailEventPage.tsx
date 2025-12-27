import { useOutletContext } from "react-router-dom";
import type { EventProviderContext } from "./EventProvider";
import EmailForm from "./EmailForm";
import { EmailRecipientType } from "types/services/EmailService";

interface Props {
}

export default function EmailEventPage({ }: Props) {
    const { info, eventId } = useOutletContext<EventProviderContext>();

    return (
        <EmailForm
            eventId={eventId}
            eventName={info!.Name}
            types={[EmailRecipientType.EventRegionOrDistrict, EmailRecipientType.RegisteredChurches, EmailRecipientType.RegisteredQuizzers, EmailRecipientType.RegisteredCoaches, EmailRecipientType.RegisteredOfficials]}
            messageTitle={info!.Name}
            subjectPrefix={`[${info!.Name}]`}
        />);
}