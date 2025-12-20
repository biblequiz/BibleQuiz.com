import { useOutletContext } from "react-router-dom";
import type { RegistrationProviderContext } from "../RegistrationProvider";
import RegistrationPageForm from "./RegistrationPageForm";
import { useEffect, useState } from "react";
import { RequiredPersonFields, type EventRoleFields } from "types/services/EventsService";
import { PersonRole } from "types/services/PeopleService";
import EventRequiredFieldCardBody from "./EventRequiredFieldCardBody";
import EventFieldCard from "./EventFieldCard";
import { sharedDirtyWindowState } from "utils/SharedState";

interface Props {
}

export interface RegistrationRoleRequiredFields {
    contactFields: RequiredPersonFields;
    roleFields: EventRoleFields;
}

export default function RegistrationRequiredFieldsPage({ }: Props) {
    const {
        context,
        isSaving,
        officialsAndAttendees,
        requiredFields,
        setRequiredFields } = useOutletContext<RegistrationProviderContext>();

    const [contactFields, setContactFields] = useState<RequiredPersonFields>(RequiredPersonFields.None);
    const [quizzerFields, setQuizzerFields] = useState<RequiredPersonFields>(RequiredPersonFields.None);
    const [coachFields, setCoachFields] = useState<RequiredPersonFields>(RequiredPersonFields.None);
    const [officialFields, setOfficialFields] = useState<RequiredPersonFields>(RequiredPersonFields.None);
    const [attendeeFields, setAttendeeFields] = useState<RequiredPersonFields>(RequiredPersonFields.None);

    useEffect(() => {
        setContactFields(requiredFields.contactFields);
        setQuizzerFields(requiredFields.roleFields[PersonRole[PersonRole.Quizzer]] ?? RequiredPersonFields.None);
        setCoachFields(requiredFields.roleFields[PersonRole[PersonRole.Coach]] ?? RequiredPersonFields.None);
        setOfficialFields(requiredFields.roleFields[PersonRole[PersonRole.Official]] ?? RequiredPersonFields.None);
        if (officialsAndAttendees.allowAttendees) {
            setAttendeeFields(requiredFields.roleFields[PersonRole[PersonRole.Attendee]] ?? RequiredPersonFields.None);
        }
    }, [requiredFields]);

    return (
        <RegistrationPageForm
            context={context}
            isSaving={isSaving}
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
            previousPageLink={`${context.rootEventUrl}/registration/officials`}
            nextPageLink={`${context.rootEventUrl}/registration/customFields`}>

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
                        setFields={f => {
                            setContactFields(f);
                            sharedDirtyWindowState.set(true);
                        }}
                        includeBirthdate={false}
                    />
                </EventFieldCard>
                <EventFieldCard title="Quizzer" width="lg:w-50">
                    <EventRequiredFieldCardBody
                        fields={quizzerFields}
                        setFields={f => {
                            setQuizzerFields(f);
                            sharedDirtyWindowState.set(true);
                        }}
                        includeBirthdate={true}
                    />
                </EventFieldCard>
                <EventFieldCard title="Coach" width="lg:w-50">
                    <EventRequiredFieldCardBody
                        fields={coachFields}
                        setFields={f => {
                            setCoachFields(f);
                            sharedDirtyWindowState.set(true);
                        }}
                        includeBirthdate={true}
                    />
                </EventFieldCard>
                <EventFieldCard title="Official" width="lg:w-50">
                    <EventRequiredFieldCardBody
                        fields={officialFields}
                        setFields={f => {
                            setOfficialFields(f);
                            sharedDirtyWindowState.set(true);
                        }}
                        includeBirthdate={true}
                    />
                </EventFieldCard>
                {officialsAndAttendees.allowAttendees && (
                    <EventFieldCard title="Attendee" width="lg:w-50">
                        <EventRequiredFieldCardBody
                            fields={attendeeFields}
                            setFields={f => {
                                setAttendeeFields(f);
                                sharedDirtyWindowState.set(true);
                            }}
                            includeBirthdate={true}
                        />
                    </EventFieldCard>)}
            </div>
        </RegistrationPageForm>);
}