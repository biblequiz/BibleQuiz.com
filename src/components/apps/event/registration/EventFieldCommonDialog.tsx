import { EventFieldControlType, EventFieldDataType, EventFieldScopes, EventFieldVisibility, type EventField } from "types/services/EventsService";
import EventFieldCommonCard from "./EventFieldCommonCard";

interface Props {
    dialogRef: React.RefObject<HTMLDialogElement | null>;
    typeId: string;
    addField(field: EventField): void;
}

export default function EventFieldCommonDialog({ dialogRef, typeId, addField }: Props) {

    return (
        <dialog ref={dialogRef} className="modal">
            <form method="dialog">
                <div className="modal-box w-full max-w-3xl">
                    <button
                        className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    >✕</button
                    >
                    <div className="flex flex-wrap gap-4">
                        <EventFieldCommonCard
                            title="Comments"
                            description="Multi-line comment box"
                            restriction="Teams Only"
                            addField={() => {
                                const newField: EventField = {
                                    Id: null,
                                    ControlType: EventFieldControlType.MultilineTextbox,
                                    DataType: EventFieldDataType.Text,
                                    Scopes: EventFieldScopes.Team,
                                    IsRequired: false,
                                    Visibility: EventFieldVisibility.ReadWrite,
                                    Label: "Comments",
                                };

                                addField(newField);
                            }} />
                        <EventFieldCommonCard
                            title="Experience as Official"
                            description="Dropdown for number of meets."
                            restriction="Officials Only"
                            addField={() => {
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

                                addField(newField);
                            }} />
                        <EventFieldCommonCard
                            title="Grade"
                            description="Grade of the quizzer."
                            restriction="Quizzers Only"
                            addField={() => {
                                const newField: EventField = {
                                    Id: null,
                                    ControlType: EventFieldControlType.GradeList,
                                    DataType: EventFieldDataType.Number,
                                    Scopes: EventFieldScopes.Quizzer,
                                    IsRequired: true,
                                    Visibility: EventFieldVisibility.ReadWrite,
                                    Label: "Grade",
                                    MinNumberValue: typeId === "agtbq" ? 6 : 0,
                                    MaxNumberValue: typeId === "agtbq" ? 12 : 6
                                };

                                addField(newField);
                            }} />
                        <EventFieldCommonCard
                            title="1:1"
                            description="Participant in the 1:1 tournament."
                            restriction="Quizzers Only"
                            addField={() => {
                                const newField: EventField = {
                                    Id: null,
                                    Label: "1:1",
                                    ControlType: EventFieldControlType.Checkbox,
                                    DataType: EventFieldDataType.Boolean,
                                    Scopes: EventFieldScopes.Quizzer,
                                    IsRequired: true,
                                    Visibility: EventFieldVisibility.ReadWrite
                                };

                                addField(newField);
                            }} />
                        <EventFieldCommonCard
                            title="T-Shirt"
                            description="Size of a T-Shirt."
                            restriction="Quizzers Only"
                            addField={() => {
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

                                addField(newField);
                            }} />
                    </div>
                    <div className="modal-action">
                        <button className="btn">Close</button>
                    </div>
                </div>
            </form>
        </dialog>);
}