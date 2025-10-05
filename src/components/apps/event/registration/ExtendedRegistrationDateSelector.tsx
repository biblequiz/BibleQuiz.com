import { useOutletContext } from "react-router-dom";
import type { RegistrationProviderContext } from "../RegistrationProvider";
import { useState } from "react";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

interface Props {
    id: string;
    label: string;
    registrationEndDate: string;
    extendedDate: string | null;
    setExtendedDate: (updated: string | null) => void;
}

export default function ExtendedRegistrationDateSelector({
    id,
    label,
    registrationEndDate,
    extendedDate,
    setExtendedDate }: Props) {

    const [allowExtended, setAllowExtended] = useState(!!extendedDate);

    return (
        <>
            <div className="w-full mt-0">
                <div className="mt-0 mb-0">
                    <label className="label">
                        <span className="label-text font-medium">Last Day to Register for {label}</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                </div>
                <div className="mb-0">
                    <label className="label text-wrap">
                        <input
                            type="checkbox"
                            name={`allowExtendedRegistration-${id}`}
                            className="checkbox checkbox-sm checkbox-info"
                            checked={allowExtended}
                            onChange={e => {
                                setAllowExtended(e.target.checked);
                                setExtendedDate(null);
                            }}
                        />
                        <span className="text-sm italic">
                            Allow extended registration after {DataTypeHelpers.formatDate(registrationEndDate, "MMM d, yyyy")}?
                        </span>
                    </label>
                </div>
                <div className="mt-0 mb-0">
                    <input
                        name={`extendedRegistrationDate-${id}`}
                        type="date"
                        className="input w-full"
                        value={extendedDate || registrationEndDate || undefined}
                        onChange={e => setExtendedDate(e.target.value)}
                        required={allowExtended}
                        disabled={!allowExtended}
                        min={registrationEndDate}
                    />
                </div>
            </div>
        </>);
}