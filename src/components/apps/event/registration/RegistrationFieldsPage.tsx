import { useOutletContext } from "react-router-dom";
import type { RegistrationProviderContext } from "../RegistrationProvider";
import RegistrationPageForm from "./RegistrationPageForm";
import { useState } from "react";
import type { EventField } from "types/services/EventsService";
import EventFieldCard from "./EventFieldCard";

interface Props {
}

export default function RegistrationFieldsPage({ }: Props) {
    const {
        rootEventUrl,
        saveRegistration,
        fields,
        setFields } = useOutletContext<RegistrationProviderContext>();

    const [eventFields, setEventFields] = useState<EventField[]>(fields);

    return (
        <RegistrationPageForm
            persistFormToEventInfo={() => setFields(eventFields)}
            saveRegistration={saveRegistration}
            previousPageLink={`${rootEventUrl}/registration/officials`}
            nextPageLink={`${rootEventUrl}/registration/divisions`}>
            <div className="flex flex-wrap gap-4">
                {fields.map(field => (
                    <EventFieldCard
                        key={field.Id}
                        field={field}
                    />
                ))}
            </div>
            <div>
                <b>Fields Section</b>
            </div>
            <p>
                This page includes the following fields:
            </p>
            <ul>
                <li>Required fields for people</li>
                <li>Custom fields (e.g., Grade, T-Shirt, etc.)</li>
            </ul>
        </RegistrationPageForm>);
}