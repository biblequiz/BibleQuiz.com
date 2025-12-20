import { useState } from "react";
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
    const [zipCode, setZipCode] = useState(address?.ZipCode || undefined);

    const getLatestAddress = (): Address | null => {
        if (DataTypeHelpers.isNullOrEmpty(streetAddress) &&
            DataTypeHelpers.isNullOrEmpty(city) &&
            !zipCode) {

            return null;
        }

        return {
            StreetAddress: streetAddress,
            City: city,
            State: state,
            ZipCode: zipCode || null
        };
    };

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
                    onChange={e => setName(e.target.value)}
                    onBlur={e => setAddressName(e.target.value)}
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
                    onChange={e => setStreetAddress(e.target.value)}
                    onBlur={() => setAddress(getLatestAddress())}
                    required={addressRequired}
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
                    onChange={e => setCity(e.target.value)}
                    onBlur={() => setAddress(getLatestAddress())}
                    required={addressRequired}
                    placeholder="Anytown (City)"
                />
            </div>
            <div className="w-full mt-0">
                <select
                    name={`state-${id}`}
                    className="select select-bordered w-full mt-0"
                    value={state || ""}
                    onChange={e => setState(e.target.value)}
                    onBlur={() => setAddress(getLatestAddress())}
                    required
                >
                    {ALL_STATES.map(s => (
                        <option key={`state-${id}-${s}`} value={s}>{s}</option>
                    ))}
                </select>
            </div>
            <div className="w-full mt-0">
                <input
                    name={`zip-${id}`}
                    type="number"
                    className="input w-full"
                    value={zipCode}
                    minLength={5}
                    maxLength={5}
                    onChange={e => setZipCode(e.target.valueAsNumber)}
                    onBlur={() => setAddress(getLatestAddress())}
                    required={addressRequired}
                    placeholder="12345 (Zip Code)"
                />
            </div>
        </div>);
}