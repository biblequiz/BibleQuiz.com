import { EventDivision } from "types/services/EventsService";
import { useState } from "react";
import { sharedDirtyWindowState } from "utils/SharedState";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import { useCustomValidity } from "utils/useCustomValidity";

interface Props {
    division: EventDivision;
    getAbbreviationValidityMessage: (abbreviation: string) => string | null;
    getLabelValidityMessage: (label: string) => string | null;

    /** Called when a value changes so the page can re-check the other cards for duplicates. */
    onChanged: () => void;
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
    getLabelValidityMessage,
    onChanged }: Props) {

    const [abbreviation, setAbbreviation] = useState<string>(division.Abbreviation || "");
    const [labelText, setLabelText] = useState<string>(division.Label || "");

    // The messages follow the current values on every render, so a duplicate flagged on this card
    // goes away as soon as the other card is changed, without tabbing through this one again.
    const abbreviationRef = useCustomValidity<HTMLInputElement>(
        abbreviation.trim()
            ? getAbbreviationValidityMessage(abbreviation)
            : "Enter a one-character abbreviation for the division.");
    const labelRef = useCustomValidity<HTMLInputElement>(
        labelText.trim()
            ? getLabelValidityMessage(labelText)
            : "Enter a label for the division.");

    return (
        <>
            <div className="w-full mt-0">
                <label className="label mb-0">
                    <span className="label-text font-medium text-sm">Abbreviation</span>
                    <span className="label-text-alt text-error">*</span>
                </label>
                <input
                    ref={abbreviationRef}
                    type="text"
                    className="input input-info w-full mt-0"
                    value={abbreviation}
                    onChange={e => {
                        // A single character, so leading/trailing spaces would only block typing the letter.
                        setAbbreviation(e.target.value.trim());

                        // Written to the division right away (not on blur) so Enter, autofill or
                        // a click that never blurs the field can't save a stale value.
                        division.Abbreviation = e.target.value.trim();
                        sharedDirtyWindowState.set(true);
                        onChanged();
                    }}
                    onBlur={() => trimAndUpdateRequiredState(abbreviation, setAbbreviation)}
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
                    ref={labelRef}
                    type="text"
                    className="input input-info w-full mt-0"
                    value={labelText}
                    onChange={e => {
                        setLabelText(e.target.value);
                        division.Label = e.target.value.trim();
                        sharedDirtyWindowState.set(true);
                        onChanged();
                    }}
                    onBlur={() => trimAndUpdateRequiredState(labelText, setLabelText)}
                    maxLength={60}
                    required
                />
            </div>
        </>);
}
