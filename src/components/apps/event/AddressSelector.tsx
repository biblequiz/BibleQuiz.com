import { useState } from "react";
import { formatStateOption } from "utils/StateLabels";
import regions from "data/regions.json";
import type { Address } from "types/services/models/Address";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

interface Props {
    id: string;
    label?: string;
    name?: string;
    address?: Address;
    setName: (name: string) => void;
    setAddress: (address: Address | null) => void;
    nameRequired?: boolean;
    addressRequired?: boolean;
}

const uniqueStates: Set<string> = new Set();
for (const region of regions) {
    for (const state of region.states) {
        uniqueStates.add(state);
    }
}

const ALL_STATES: string[] = [];
uniqueStates.forEach(s => ALL_STATES.push(s));
ALL_STATES.sort();

export default function AddressSelector({
    id,
    label,
    name: addressName,
    address,
    setName: setAddressName,
    setAddress,
    nameRequired = false,
    addressRequired = false }: Props) {

    const [name, setName] = useState(addressName || "");
    const [streetAddress, setStreetAddress] = useState(address?.StreetAddress || "");
    const [city, setCity] = useState(address?.City || "");
    const [state, setState] = useState(address?.State || "");
    const [zipText, setZipText] = useState(address?.ZipCode ? String(address.ZipCode).padStart(5, "0") : "");

    // Only the 5 digits are stored, so a ZIP+4 (what browsers often autofill) is accepted too.
    const parseZipCode = (text: string): number | null => {
        const match = /^\s*(\d{5})(?:-\d{4})?\s*$/.exec(text);
        return match ? parseInt(match[1], 10) : null;
    };

    const buildAddress = (
        newStreetAddress: string,
        newCity: string,
        newState: string,
        newZipText: string): Address | null => {

        if (DataTypeHelpers.isNullOrEmpty(newStreetAddress) &&
            DataTypeHelpers.isNullOrEmpty(newCity) &&
            DataTypeHelpers.isNullOrEmpty(newZipText)) {

            return null;
        }

        return {
            StreetAddress: newStreetAddress,
            City: newCity,
            State: newState,
            ZipCode: parseZipCode(newZipText)
        };
    };

    // Every change goes to the page straight away. Waiting for blur meant that a browser
    // autofill (which fills every field without blurring any of them) left the page holding
    // the old address until each field had been tabbed through.
    const updateAddress = (
        newStreetAddress: string,
        newCity: string,
        newState: string,
        newZipText: string) => {

        setStreetAddress(newStreetAddress);
        setCity(newCity);
        setState(newState);
        setZipText(newZipText);
        setAddress(buildAddress(newStreetAddress, newCity, newState, newZipText));
    };

    const hasAddress = !!buildAddress(streetAddress, city, state, zipText);

    return (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2 p-2 mt-0">
            <div className="w-full mt-0 md:col-span-6">
                <label className="label">
                    <span className="label-text font-medium">{label}</span>
                    {addressRequired && (<span className="label-text-alt text-error">*</span>)}
                </label>
                <input
                    name={`name-${id}`}
                    type="text"
                    className="input w-full"
                    value={name}
                    maxLength={500}
                    onChange={e => {
                        setName(e.target.value);
                        setAddressName(e.target.value);
                    }}
                    required={nameRequired}
                    placeholder={label}
                />
            </div>
            <div className="w-full mt-0 md:col-span-2">
                <input
                    name={`streetAddress-${id}`}
                    type="text"
                    className="input w-full"
                    value={streetAddress}
                    maxLength={200}
                    onChange={e => updateAddress(e.target.value, city, state, zipText)}
                    required={addressRequired || hasAddress}
                    placeholder="123 Main St (Street Address)"
                />
            </div>
            <div className="w-full mt-0 md:col-span-2">
                <input
                    name={`city-${id}`}
                    type="text"
                    className="input w-full"
                    value={city}
                    maxLength={100}
                    onChange={e => updateAddress(streetAddress, e.target.value, state, zipText)}
                    required={addressRequired || hasAddress}
                    placeholder="Anytown (City)"
                />
            </div>
            <div className="w-full mt-0">
                <select
                    name={`state-${id}`}
                    className="select select-bordered w-full mt-0"
                    value={state || ""}
                    onChange={e => updateAddress(streetAddress, city, e.target.value, zipText)}
                    required={addressRequired || hasAddress}
                >
                    <option value="" disabled>State</option>
                    {ALL_STATES.map(s => (
                        <option key={`state-${id}-${s}`} value={s}>{formatStateOption(s)}</option>
                    ))}
                </select>
            </div>
            <div className="w-full mt-0">
                <input
                    name={`zip-${id}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    className="input w-full"
                    value={zipText}
                    maxLength={10}
                    pattern="\s*\d{5}(-\d{4})?\s*"
                    title="Enter a 5-digit ZIP code, like 12345 or 12345-6789."
                    onChange={e => updateAddress(streetAddress, city, state, e.target.value)}
                    required={addressRequired || hasAddress}
                    placeholder="12345 (Zip Code)"
                />
            </div>
        </div>);
}