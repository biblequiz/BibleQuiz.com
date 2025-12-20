import { EventDivision } from "types/services/EventsService";
import { useState } from "react";
import { sharedDirtyWindowState } from "utils/SharedState";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

interface Props {
    division: EventDivision;
    getAbbreviationValidityMessage: (abbreviation: string) => string | null;
    getLabelValidityMessage: (label: string) => string | null;
}

function trimAndUpdateRequiredState(
    fieldValue: string | null | undefined,
    setFieldValue: (value: string) => void): string {

    const trimmed = DataTypeHelpers.trimToNull(fieldValue) ?? "";
    if (trimmed !== fieldValue) {
        setFieldValue(trimmed);
    }

    return trimmed;
}

export default function EventDivisionCardBody({
    division,
    getAbbreviationValidityMessage,
    getLabelValidityMessage }: Props) {

    const [abbreviation, setAbbreviation] = useState<string>(division.Abbreviation || "");
    const [labelText, setLabelText] = useState<string>(division.Label || "");

    return (
        <>
            <div className="w-full mt-0">
                <label className="label mb-0">
                    <span className="label-text font-medium text-sm">Abbreviation</span>
                    <span className="label-text-alt text-error">*</span>
                </label>
                <input
                    type="text"
                    className="input input-info w-full mt-0"
                    value={abbreviation}
                    onChange={e => {
                        e.target.setCustomValidity("");
                        setAbbreviation(e.target.value);
                    }}
                    onBlur={e => {

                        const validityMessage = getAbbreviationValidityMessage(abbreviation);
                        (e.target as HTMLInputElement).setCustomValidity(
                            validityMessage || "");

                        division.Abbreviation = trimAndUpdateRequiredState(abbreviation, setAbbreviation);
                        sharedDirtyWindowState.set(true);
                    }}
                    maxLength={1}
                    required
                />
            </div>
            <div className="w-full mt-0">
                <label className="label mb-0">
                    <span className="label-text font-medium text-sm">Label</span>
                    <span className="label-text-alt text-error">*</span>
                </label>
                <input
                    type="text"
                    className="input input-info w-full mt-0"
                    value={labelText}
                    onChange={e => {
                        e.target.setCustomValidity("");
                        setLabelText(e.target.value);
                    }}
                    onBlur={e => {

                        const validityMessage = getLabelValidityMessage(labelText);
                        (e.target as HTMLInputElement).setCustomValidity(
                            validityMessage || "");

                        division.Label = trimAndUpdateRequiredState(labelText, setLabelText);
                        sharedDirtyWindowState.set(true);
                    }}
                    maxLength={60}
                    required
                />
            </div>
        </>);
}