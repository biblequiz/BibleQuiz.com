import { RequiredPersonFields } from "types/services/EventsService";

interface Props {
    fields: RequiredPersonFields;
    setFields: (value: RequiredPersonFields) => void;
    includeBirthdate: boolean;
}

export default function EventRequiredFieldCardBody({ fields, setFields, includeBirthdate }: Props) {

    const getFieldCheckbox = (boxField: RequiredPersonFields, text: string) => {

        return (
            <label className="label ml-2 mt-2">
                <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-info"
                    checked={(fields & boxField) == boxField}
                    onChange={e =>
                        setFields(
                            e.target.checked
                                ? (fields | boxField)
                                : (fields & ~boxField))}
                />
                <span>
                    {text}
                </span>
            </label>
        );
    };

    return (
        <>
            <div className="w-full flex flex-col mt-0">
                {getFieldCheckbox(RequiredPersonFields.Email, "E-mail Address")}
                {getFieldCheckbox(RequiredPersonFields.PhoneNumber, "Phone Number")}
                {includeBirthdate && getFieldCheckbox(RequiredPersonFields.DateOfBirth, "Birthdate")}
                {getFieldCheckbox(RequiredPersonFields.Address, "Address")}
            </div>
        </>);
}