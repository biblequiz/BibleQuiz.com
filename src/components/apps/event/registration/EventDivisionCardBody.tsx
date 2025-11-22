import { EventDivision } from "types/services/EventsService";
import { useState } from "react";
import { sharedDirtyWindowState } from "utils/SharedState";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import FontAwesomeIcon from "components/FontAwesomeIcon";

interface Props {
    division: EventDivision;
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

export default function EventDivisionCardBody({ division }: Props) {

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
                    onChange={e => setAbbreviation(e.target.value)}
                    onBlur={e => {
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
                    onChange={e => setLabelText(e.target.value)}
                    onBlur={e => {
                        division.Label = trimAndUpdateRequiredState(labelText, setLabelText);
                        sharedDirtyWindowState.set(true);
                    }}
                    maxLength={60}
                    required
                />
            </div>
        </>);
}