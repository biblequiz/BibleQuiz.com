import { useOutletContext } from "react-router-dom";
import type { RegistrationProviderContext } from "../RegistrationProvider";
import RegistrationPageForm from "./RegistrationPageForm";
import { useState } from "react";
import { EventFieldControlType, EventFieldDataType, EventFieldScopes, EventFieldVisibility, type EventField } from "types/services/EventsService";
import EventFieldCard from "./EventFieldCard";
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

    // TODO: Multi-line text is only allowed for team.

    return (
        <RegistrationPageForm
            persistFormToEventInfo={() => setFields(eventFields)}
            saveRegistration={saveRegistration}
            previousPageLink={`${rootEventUrl}/registration/officials`}
            nextPageLink={`${rootEventUrl}/registration/divisions`}>
            <div className="flex flex-wrap gap-4">
                {eventFields.map(field => (
                    <EventFieldCard
                        key={field.Id}
                        field={field}
                    />
                ))}
                <div
                    className="card live-events-card w-84 card-sm shadow-sm border-2 border-solid mt-0 relative"
                >
                    <div className="card-body">
                        <div className="dropdown">
                            <button tabIndex={0} role="button" className="btn btn-primary w-full">
                                <FontAwesomeIcon icon="fas faPlus" />
                                Common Fields
                            </button>
                            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow mt-1">
                                <li>
                                    <button
                                        type="button"
                                        className="mt-0 mb-0 pt-1 pb-1"
                                        onClick={() => {
                                            const newField: EventField = {
                                                Id: null,
                                                ControlType: EventFieldControlType.MultilineTextbox,
                                                DataType: EventFieldDataType.Text,
                                                Scopes: EventFieldScopes.Team,
                                                IsRequired: false,
                                                Visibility: EventFieldVisibility.ReadWrite,
                                                Label: "Comments",
                                            };

                                            setEventFields(prevFields => [...prevFields, newField])
                                        }}>
                                        Comment Box
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        className="mt-0 mb-0 pt-1 pb-1"
                                        onClick={() => {
                                            const newField: EventField = {
                                                Id: null,
                                                Label: "# of Meets Exp.",
                                                Caption: "# of Meets as Official",
                                                ControlType: EventFieldControlType.DropdownList,
                                                DataType: EventFieldDataType.Text,
                                                Scopes: EventFieldScopes.Official,
                                                IsRequired: true,
                                                Values: ["0", "1", "2", "3+"],
                                                Visibility: EventFieldVisibility.ReadWrite
                                            };

                                            setEventFields(prevFields => [...prevFields, newField])
                                        }}>
                                        # of Meets as Official
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        className="mt-0 mb-0 pt-1 pb-1"
                                        onClick={() => {
                                            const newField: EventField = {
                                                Id: null,
                                                ControlType: EventFieldControlType.GradeList,
                                                DataType: EventFieldDataType.Number,
                                                Scopes: EventFieldScopes.Quizzer,
                                                IsRequired: true,
                                                Visibility: EventFieldVisibility.ReadWrite,
                                                Label: "Grade",
                                                MinNumberValue: general.typeId === "agtbq" ? 6 : 0,
                                                MaxNumberValue: general.typeId === "agtbq" ? 12 : 6
                                            };

                                            setEventFields(prevFields => [...prevFields, newField])
                                        }}>
                                        Quizzer Grade
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        className="mt-0 mb-0 pt-1 pb-1"
                                        onClick={() => {
                                            const newField: EventField = {
                                                Id: null,
                                                Label: "1:1",
                                                ControlType: EventFieldControlType.Checkbox,
                                                DataType: EventFieldDataType.Boolean,
                                                Scopes: EventFieldScopes.Quizzer,
                                                IsRequired: true,
                                                Visibility: EventFieldVisibility.ReadWrite
                                            };

                                            setEventFields(prevFields => [...prevFields, newField])
                                        }}>
                                        One-on-One
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        className="mt-0 mb-0 pt-1 pb-1"
                                        onClick={() => {
                                            const newField: EventField = {
                                                Id: null,
                                                Label: "T-Shirt",
                                                ControlType: EventFieldControlType.DropdownList,
                                                DataType: EventFieldDataType.Text,
                                                Scopes: EventFieldScopes.Coach | EventFieldScopes.Official | EventFieldScopes.Quizzer,
                                                IsRequired: true,
                                                Values: ["None", "XS", "S", "M", "L", "XL", "XXL", "XXXL"],
                                                PaymentUnselectValue: "None",
                                                Visibility: EventFieldVisibility.ReadWrite
                                            };

                                            setEventFields(prevFields => [...prevFields, newField])
                                        }}>
                                        T-Shirt Size
                                    </button>
                                </li>
                            </ul>
                        </div>
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

                                setEventFields(prevFields => [...prevFields, newField])
                            }}>
                            <FontAwesomeIcon icon="fas faPlus" />
                            Other Field
                        </button>
                    </div>
                </div>
            </div>
        </RegistrationPageForm>);
}