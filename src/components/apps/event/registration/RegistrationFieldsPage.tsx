import { useOutletContext } from "react-router-dom";
import type { RegistrationProviderContext } from "../RegistrationProvider";
import RegistrationPageForm from "./RegistrationPageForm";
import { useRef, useState } from "react";
import { EventFieldControlType, EventFieldDataType, EventFieldScopes, EventFieldVisibility, type EventField } from "types/services/EventsService";
import EventFieldCard from "./EventFieldCard";
import EventFieldCardBody from "./EventFieldCardBody";
import EventFieldCommonDialog from "./EventFieldCommonDialog";
import FontAwesomeIcon from "components/FontAwesomeIcon";

interface Props {
}

export default function RegistrationFieldsPage({ }: Props) {
    const {
        rootEventUrl,
        saveRegistration,
        general,
        fields,
        setFields } = useOutletContext<RegistrationProviderContext>();

    const [eventFields, setEventFields] = useState<EventField[]>(() => [...fields]);

    const commonDialogRef = useRef<HTMLDialogElement>(null);

    // TODO: Multi-line text is only allowed for team.

    return (
        <>
            <RegistrationPageForm
                persistFormToEventInfo={() => setFields(eventFields)}
                saveRegistration={saveRegistration}
                previousPageLink={`${rootEventUrl}/registration/officials`}
                nextPageLink={`${rootEventUrl}/registration/divisions`}>
                <div className="flex flex-wrap gap-4">
                    {eventFields.map(field => (
                        <EventFieldCard key={field.Id}>
                            <EventFieldCardBody field={field} />
                        </EventFieldCard>
                    ))}
                    <EventFieldCard>
                        <button
                            tabIndex={0}
                            type="button"
                            role="button"
                            className="btn btn-primary w-full"
                            onClick={e => {
                                e.preventDefault();
                                commonDialogRef.current?.showModal();
                            }}>
                            <FontAwesomeIcon icon="fas faPlus" />
                            Common Fields
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary w-full mt-0 mb-0 pt-1 pb-1"
                            onClick={() => {
                                const newField: EventField = {
                                    Id: null,
                                    Label: "",
                                    ControlType: EventFieldControlType.Checkbox,
                                    DataType: EventFieldDataType.Text,
                                    Scopes: EventFieldScopes.Coach | EventFieldScopes.Official | EventFieldScopes.Quizzer,
                                    IsRequired: true,
                                    Visibility: EventFieldVisibility.ReadWrite
                                };

                                setEventFields(prevFields => [...prevFields, newField]);
                            }}>
                            <FontAwesomeIcon icon="fas faPlus" />
                            Other Field
                        </button>
                    </EventFieldCard>
                </div>
            </RegistrationPageForm>
            <EventFieldCommonDialog
                typeId={general.typeId}
                addField={(field: EventField) => {
                    setEventFields(prevFields => [...prevFields, field]);
                }}
                dialogRef={commonDialogRef}
            />
        </>);
}