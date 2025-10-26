import { useOutletContext } from "react-router-dom";
import type { RegistrationProviderContext } from "../RegistrationProvider";
import RegistrationPageForm from "./RegistrationPageForm";
import { useState } from "react";
import { EventFieldControlType, EventFieldDataType, EventFieldScopes, EventFieldVisibility, type EventField } from "types/services/EventsService";
import EventFieldCard from "./EventFieldCard";
import EventFieldControl from "../fields/EventFieldControl";

interface Props {
}

export default function RegistrationFieldsPage({ }: Props) {
    const {
        rootEventUrl,
        saveRegistration,
        fields,
        setFields } = useOutletContext<RegistrationProviderContext>();

    const [eventFields, setEventFields] = useState<EventField[]>(fields);
    const [textField, setTextField] = useState<string>("");
    const [numberField, setNumberField] = useState<string>("1");
    const [dateField, setDateField] = useState<string>("");

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 mt-0">
                <div className="w-full mt-0">
                    <EventFieldControl
                        field={{
                            Id: "example1",
                            ControlType: EventFieldControlType.Checkbox,
                            DataType: EventFieldDataType.Boolean,
                            IsRequired: true,
                            Label: "My Text Field",
                            Caption: "My caption",
                            Visibility: EventFieldVisibility.ReadWrite,
                            Scopes: EventFieldScopes.Coach,
                            Values: null,
                            MinNumberValue: null,
                            MaxNumberValue: null,
                            MaxCount: null,
                            PaymentIfSelected: null,
                            PaymentScopes: null,
                            PaymentUnselectValue: null,
                            PaymentOverrides: null
                        }}
                        isDisabled={false}
                        controlNamePrefix={"txt_example_"}
                        value={textField}
                        setValue={setTextField}
                        isExampleOnly={false}
                    />
                </div>
                <div className="w-full mt-0">
                    <EventFieldControl
                        field={{
                            Id: "example2",
                            ControlType: EventFieldControlType.HtmlCheckbox,
                            DataType: EventFieldDataType.Boolean,
                            IsRequired: true,
                            Label: "My Number Field",
                            Caption: "<b>My caption</b>",
                            Visibility: EventFieldVisibility.ReadWrite,
                            Scopes: EventFieldScopes.Coach,
                            Values: null,
                            MinNumberValue: null,
                            MaxNumberValue: null,
                            MaxCount: null,
                            PaymentIfSelected: null,
                            PaymentScopes: null,
                            PaymentUnselectValue: null,
                            PaymentOverrides: null
                        }}
                        isDisabled={false}
                        controlNamePrefix={"num_example_"}
                        value={numberField}
                        setValue={setNumberField}
                        isExampleOnly={false}
                    />
                </div>
                <div className="w-full mt-0">
                    <EventFieldControl
                        field={{
                            Id: "example3",
                            ControlType: EventFieldControlType.MultilineTextbox,
                            DataType: EventFieldDataType.Text,
                            IsRequired: true,
                            Label: "My Date Field",
                            Caption: "Caption",
                            Visibility: EventFieldVisibility.ReadWrite,
                            Scopes: EventFieldScopes.Coach,
                            Values: null,
                            MinNumberValue: null,
                            MaxNumberValue: null,
                            MaxCount: null,
                            PaymentIfSelected: null,
                            PaymentScopes: null,
                            PaymentUnselectValue: null,
                            PaymentOverrides: null
                        }}
                        isDisabled={false}
                        controlNamePrefix={"date_example_"}
                        value={dateField}
                        setValue={setDateField}
                        isExampleOnly={false}
                    />
                </div>
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