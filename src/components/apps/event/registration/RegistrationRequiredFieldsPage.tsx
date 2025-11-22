import { useOutletContext } from "react-router-dom";
import type { RegistrationProviderContext } from "../RegistrationProvider";
import RegistrationPageForm from "./RegistrationPageForm";
import { useState } from "react";
import { RequiredPersonFields, type EventRoleFields } from "types/services/EventsService";
import { PersonRole } from "types/services/PeopleService";
import EventRequiredFieldCardBody from "./EventRequiredFieldCardBody";
import EventCard from "components/apps/liveAndUpcoming/EventCard";
import EventFieldCard from "./EventFieldCard";

interface Props {
}

export interface RegistrationRoleRequiredFields {
    contactFields: RequiredPersonFields;
    roleFields: EventRoleFields;
}

export default function RegistrationRequiredFieldsPage({ }: Props) {
    const {
        rootEventUrl,
        saveRegistration,
        officialsAndAttendees,
        requiredFields,
        setRequiredFields } = useOutletContext<RegistrationProviderContext>();

    const [contactFields, setContactFields] = useState<RequiredPersonFields>(() => requiredFields.contactFields);
    const [quizzerFields, setQuizzerFields] = useState<RequiredPersonFields>(() => requiredFields.roleFields[PersonRole[PersonRole.Quizzer]] ?? RequiredPersonFields.None);
    const [coachFields, setCoachFields] = useState<RequiredPersonFields>(() => requiredFields.roleFields[PersonRole[PersonRole.Coach]] ?? RequiredPersonFields.None);
    const [officialFields, setOfficialFields] = useState<RequiredPersonFields>(() => requiredFields.roleFields[PersonRole[PersonRole.Official]] ?? RequiredPersonFields.None);
    const [attendeeFields, setAttendeeFields] = useState<RequiredPersonFields>(() => requiredFields.roleFields[PersonRole[PersonRole.Attendee]] ?? RequiredPersonFields.None);

    return (
        <RegistrationPageForm
            rootEventUrl={rootEventUrl}
            persistFormToEventInfo={() => {

                const newRoleFields: EventRoleFields = {
                    [PersonRole[PersonRole.Quizzer]]: quizzerFields,
                    [PersonRole[PersonRole.Coach]]: coachFields,
                    [PersonRole[PersonRole.Official]]: officialFields,
                };

                if (officialsAndAttendees.allowAttendees) {
                    newRoleFields[PersonRole[PersonRole.Attendee]] = attendeeFields;
                }

                setRequiredFields({
                    contactFields: contactFields,
                    roleFields: newRoleFields
                });
            }}
            saveRegistration={saveRegistration}
            previousPageLink={`${rootEventUrl}/registration/officials`}
            nextPageLink={`${rootEventUrl}/registration/customFields`}>

            <p>
                By default, only a person's name is required. However, there are cases where additional information
                may be needed. For example, you may want to require an e-mail address or phone number for the coach or team contact.
                If a person is missing one of these fields during registration, they will be required to enter them. Any updates to
                people will require this information be added.
            </p>

            <div className="flex flex-wrap gap-4">
                <EventFieldCard title="Team Contact" width="lg:w-50">
                    <EventRequiredFieldCardBody
                        fields={contactFields}
                        setFields={setContactFields}
                        includeBirthdate={false}
                    />
                </EventFieldCard>
                <EventFieldCard title="Quizzer" width="lg:w-50">
                    <EventRequiredFieldCardBody
                        fields={quizzerFields}
                        setFields={setQuizzerFields}
                        includeBirthdate={true}
                    />
                </EventFieldCard>
                <EventFieldCard title="Coach" width="lg:w-50">
                    <EventRequiredFieldCardBody
                        fields={coachFields}
                        setFields={setCoachFields}
                        includeBirthdate={true}
                    />
                </EventFieldCard>
                <EventFieldCard title="Official" width="lg:w-50">
                    <EventRequiredFieldCardBody
                        fields={officialFields}
                        setFields={setOfficialFields}
                        includeBirthdate={true}
                    />
                </EventFieldCard>
                {officialsAndAttendees.allowAttendees && (
                    <EventFieldCard title="Attendee" width="lg:w-50">
                        <EventRequiredFieldCardBody
                            fields={attendeeFields}
                            setFields={setAttendeeFields}
                            includeBirthdate={true}
                        />
                    </EventFieldCard>)}
            </div>
        </RegistrationPageForm>);
}