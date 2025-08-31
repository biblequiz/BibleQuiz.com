import { useRef, useState } from "react";
import { Church, ChurchesService } from 'types/services/ChurchesService';
import districts from 'data/districts.json';
import FontAwesomeIcon from './FontAwesomeIcon';
import type { DistrictInfo } from 'types/RegionAndDistricts';
import type { Address } from 'types/services/models/Address';
import { AuthManager } from 'types/AuthManager';
import type { RemoteServiceError } from 'types/services/RemoteServiceUtility';

export interface AddingChurchState {
    districtId: string | null;
    state: string | null;
    onCompleted: (church: Church | null) => void;
}

interface Props {
    title: string;
    addState?: AddingChurchState,
    church?: Church;
    creatorEmail?: string;
    authorizeChurch?: boolean;
    onSave: (church: Church | null) => void;
}

const DISTRICTS_BY_STATE: Record<string, DistrictInfo[]> = {};
{
    const indexedByState: Record<string, DistrictInfo[]> = {};
    for (const district of (districts as any as DistrictInfo[])) {
        for (const state of district.states) {
            const stateDistricts = indexedByState[state];
            if (stateDistricts) {
                stateDistricts.push(district);
            }
            else {
                indexedByState[state] = [district];
            }
        }
    }

    const sortedStates = Array.from(Object.keys(indexedByState)).sort();
    for (const state of sortedStates) {
        DISTRICTS_BY_STATE[state] = indexedByState[state];
    }
}

export default function ChurchSettingsDialog({
    title,
    addState,
    church,
    creatorEmail,
    authorizeChurch = false,
    onSave }: Props) {

    const dialogRef = useRef<HTMLDialogElement>(null);

    const auth = AuthManager.useNanoStore();

    const [state, setState] = useState(() => church?.PhysicalAddress?.State || addState?.state || Object.keys(DISTRICTS_BY_STATE)[0]);
    const allowedDistricts = DISTRICTS_BY_STATE[state];

    const [isSaving, setIsSaving] = useState(false);
    const [savingError, setSavingError] = useState<string | null>(null);
    const [name, setName] = useState(church?.Name || "");
    const [streetAddress, setStreetAddress] = useState(church?.PhysicalAddress?.StreetAddress || "");
    const [city, setCity] = useState(church?.PhysicalAddress?.City || "");
    const [zipCode, setZipCode] = useState(church?.PhysicalAddress?.ZipCode || null);
    const [districtId, setDistrictId] = useState(church?.DistrictId || addState?.districtId || allowedDistricts[0]?.id);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        event.stopPropagation();

        const updatedChurch = new Church();
        updatedChurch.Id = church?.Id || null;
        updatedChurch.Name = name;
        updatedChurch.DistrictId = districtId;
        updatedChurch.PhysicalAddress = {
            StreetAddress: streetAddress,
            City: city,
            State: state,
            ZipCode: zipCode
        } as Address;

        setIsSaving(true);

        ChurchesService.create(
            auth,
            updatedChurch,
            authorizeChurch,
            creatorEmail)
            .then(c => {
                setIsSaving(false);
                addState?.onCompleted(c);
                onSave(c);
                dialogRef.current?.close();
            })
            .catch((error: RemoteServiceError) => {
                setSavingError(error.message || "An error occurred while saving the church.");
                setIsSaving(false);
            });
    };

    return (
        <dialog ref={dialogRef} className="modal" open>
            <div className="modal-box w-11/12 max-w-full md:w-3/4 lg:w-1/2">
                <h3 className="font-bold text-lg">{title}</h3>
                <form method="dialog gap-2" onSubmit={handleSubmit}>
                    <div>
                        {savingError && (
                            <div role="alert" className="alert alert-error mt-0 w-full">
                                <FontAwesomeIcon icon="fas faCircleExclamation" />
                                <div>
                                    <b>Error: </b> {savingError}
                                </div>
                            </div>)}
                        <div className="w-full">
                            <label className="label">
                                <span className="label-text font-medium">Name</span>
                                <span className="label-text-alt text-error">*</span>
                            </label>
                            <input
                                type="text"
                                name="churchName"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Enter Name"
                                maxLength={100}
                                className="input input-bordered w-full"
                                disabled={isSaving}
                                required
                            />
                        </div>
                        <div className="w-full">
                            <label className="label">
                                <span className="label-text font-medium">Street Address</span>
                                <span className="label-text-alt text-error">*</span>
                            </label>
                            <input
                                type="text"
                                name="churchStreetAddress"
                                value={streetAddress}
                                onChange={e => setStreetAddress(e.target.value)}
                                placeholder="Enter Street Address"
                                maxLength={200}
                                className="input input-bordered w-full"
                                disabled={isSaving}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                            <div className="md:col-span-4 mt-0">
                                <label className="label">
                                    <span className="label-text font-medium">City</span>
                                    <span className="label-text-alt text-error">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="churchCity"
                                    value={city}
                                    onChange={e => setCity(e.target.value)}
                                    maxLength={100}
                                    placeholder="Enter City"
                                    className="input input-bordered w-full"
                                    disabled={isSaving}
                                    required
                                />
                            </div>
                            <div className="md:col-span-1 mt-0">
                                <label className="label">
                                    <span className="label-text font-medium">State</span>
                                    <span className="label-text-alt text-error">*</span>
                                </label>
                                <div className="mt-0">
                                    <select
                                        className="select select-bordered w-full"
                                        value={state}
                                        onChange={e => {
                                            setState(e.target.value);

                                            const potentialDistricts = DISTRICTS_BY_STATE[e.target.value];
                                            if (potentialDistricts.length > 0) {
                                                setDistrictId(potentialDistricts[0].id);
                                            }
                                        }}
                                        disabled={isSaving}
                                        required
                                    >
                                        {Object.keys(DISTRICTS_BY_STATE).map(s => (
                                            <option key={`state_${s}`} value={s}>
                                                {s}
                                            </option>))}
                                    </select>
                                </div>
                            </div>
                            <div className="md:col-span-1 mt-0">
                                <label className="label">
                                    <span className="label-text font-medium">Zip</span>
                                    <span className="label-text-alt text-error">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="zip"
                                    value={zipCode || undefined}
                                    onChange={e => setZipCode(Number(e.target.value))}
                                    placeholder="Enter Zip"
                                    className="input input-bordered w-full"
                                    disabled={isSaving}
                                    minLength={5}
                                    maxLength={5}
                                    pattern="[0-9]*"
                                    required
                                />
                            </div>
                        </div>
                        {allowedDistricts && allowedDistricts.length > 1 && (
                            <div className="w-full">
                                <label className="label">
                                    <span className="label-text font-medium">District</span>
                                    <span className="label-text-alt text-error">*</span>
                                </label>
                                <div className="mt-0">
                                    <select
                                        className="select select-bordered w-full"
                                        value={districtId}
                                        onChange={e => setDistrictId(e.target.value)}
                                        disabled={isSaving}
                                        required
                                    >
                                        {DISTRICTS_BY_STATE[state].map(d => {
                                            return (
                                                <option key={`district_${d.id}`} value={d.id}>
                                                    {d.name}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>)}
                    </div>
                    <div className="mt-4 text-right">
                        <button
                            className="btn btn-primary mr-2 mt-0"
                            type="submit"
                            disabled={isSaving}
                            tabIndex={1}>
                            <FontAwesomeIcon icon="fas faCheck" />
                            Save
                        </button>
                        <button
                            className="btn btn-warning mt-0"
                            type="button"
                            disabled={isSaving}
                            tabIndex={2}
                            onClick={() => {
                                addState?.onCompleted(null);
                                onSave(null);
                                dialogRef.current?.close();
                            }}>
                            <FontAwesomeIcon icon="fas faMinusCircle" />
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </dialog>);
}