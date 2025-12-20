import { useOutletContext } from "react-router-dom";
import type { RegistrationProviderContext } from "../RegistrationProvider";
import RegistrationPageForm from "./RegistrationPageForm";
import { useRef, useState } from "react";
import { EventFieldControlType, EventFieldDataType, EventFieldScopes, EventFieldVisibility, type EventField } from "types/services/EventsService";
import EventFieldCard from "./EventFieldCard";
import EventFieldCardBody from "./EventFieldCardBody";
import EventFieldCommonDialog from "./EventFieldCommonDialog";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { sharedDirtyWindowState } from "utils/SharedState";
import LocalIdGenerator from "utils/LocalIdGenerator";
import ConfirmationDialog from "components/ConfirmationDialog";

interface Props {
}

export default function RegistrationCustomFieldsPage({ }: Props) {
    const {
        context,
        isSaving,
        general,
        officialsAndAttendees,
        fields,
        setFields } = useOutletContext<RegistrationProviderContext>();

    const [eventFields, setEventFields] = useState<EventField[]>(() => [...fields]);
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

    const commonDialogRef = useRef<HTMLDialogElement>(null);

    return (
        <>
            <RegistrationPageForm
                context={context}
                isSaving={isSaving}
                persistFormToEventInfo={() => setFields(eventFields)}
                previousPageLink={`${context.rootEventUrl}/registration/requiredFields`}
                nextPageLink={`${context.rootEventUrl}/registration/divisions`}>
                <div className="flex flex-wrap gap-4">
                    {eventFields.map((field, index) => (
                        <EventFieldCard key={`field_${field.Id ?? LocalIdGenerator.getLocalId(field)}`}>
                            <div className="w-full mt-0">
                                <button
                                    type="button"
                                    className="btn btn-primary w-3/8 mt-0 mb-0 pt-1 pb-1"
                                    onClick={() => {
                                        const newFields = [...eventFields];
                                        const current = newFields[index];
                                        newFields[index] = newFields[index - 1];
                                        newFields[index - 1] = current;

                                        setEventFields(newFields);
                                        setFields(newFields);
                                        sharedDirtyWindowState.set(true);
                                    }}
                                    disabled={index < 1}>
                                    <FontAwesomeIcon icon="fas faArrowLeft" />
                                    Move
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary w-3/8 mt-0 mb-0 ml-2 pt-1 pb-1"
                                    onClick={() => {
                                        const newFields = [...eventFields];
                                        const current = newFields[index];
                                        newFields[index] = newFields[index + 1];
                                        newFields[index + 1] = current;

                                        setEventFields(newFields);
                                        setFields(newFields);
                                        sharedDirtyWindowState.set(true);
                                    }}
                                    disabled={index >= eventFields.length - 1}>
                                    <FontAwesomeIcon icon="fas faArrowRight" />
                                    Move
                                </button>
                            </div>
                            <EventFieldCardBody
                                field={field}
                                allowAttendees={officialsAndAttendees.allowAttendees}
                                getLabelValidityMessage={newLabel => {
                                    if (newLabel) {
                                        newLabel = newLabel.trim().toLowerCase();
                                        const duplicates = eventFields.filter(f => f !== field && f.Label && f.Label.toLowerCase() === newLabel);
                                        if (duplicates.length > 0) {
                                            return "Labels must be unique across fields.";
                                        }
                                    }

                                    return null;
                                }}
                            />
                            <div className="w-full mt-0">
                                <button
                                    type="button"
                                    className="btn btn-error text-white w-full mt-0 mb-0 pt-1 pb-1"
                                    onClick={() => setDeleteIndex(index)}>
                                    <FontAwesomeIcon icon="fas faTrash" />
                                    Delete Field
                                </button>
                            </div>
                        </EventFieldCard>
                    ))}
                    <EventFieldCard alignMiddle={true}>
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
                                sharedDirtyWindowState.set(true);
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
                    sharedDirtyWindowState.set(true);
                }}
                dialogRef={commonDialogRef}
            />
            {deleteIndex !== null && (
                <ConfirmationDialog
                    title="Confirm Deletion?"
                    yesLabel="Delete"
                    onYes={() => {
                        const newFields = eventFields.filter((_, i) => i !== deleteIndex);
                        setEventFields(newFields);
                        setFields(newFields);
                        setDeleteIndex(null);
                        sharedDirtyWindowState.set(true);
                    }}
                    noLabel="Cancel"
                    onNo={() => setDeleteIndex(null)}
                >
                    <p>
                        This field may already be in use. Are you sure you want to delete it?
                    </p>
                    <p>
                        You <b>CANNOT</b> undo this change if you save it.
                    </p>
                </ConfirmationDialog>)}
        </>);
}