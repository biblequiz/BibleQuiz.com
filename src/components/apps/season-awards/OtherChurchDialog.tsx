import { useState, useRef } from "react";
import ChurchLookup, { ChurchSearchTips } from "components/ChurchLookup";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useModalDialog } from "hooks/useModalDialog";
import type { DistrictInfo } from "types/RegionAndDistricts";
import type { Church } from "types/services/ChurchesService";

interface Props {
    districts: DistrictInfo[];
    onSelect: (church: Church) => void;
    onClose: () => void;
}

export default function OtherChurchDialog({ districts, onSelect, onClose }: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [districtId, setDistrictId] = useState(districts[0]?.id ?? "");
    useModalDialog(dialogRef, onClose);

    const district = districts.find((item) => item.id === districtId);

    return (
        <dialog ref={dialogRef} className="modal">
            <div className="modal-box w-full max-w-3xl">
                <h2 className="text-xl font-bold mt-0">Select Another Church</h2>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    aria-label="Close"
                    onClick={onClose}
                >
                    <FontAwesomeIcon icon="fas faXmark" />
                </button>

                <label className="form-control w-full mb-4">
                    <span className="label-text font-semibold mb-1">District</span>
                    <select
                        className="select select-bordered w-full"
                        value={districtId}
                        onChange={(event) => setDistrictId(event.target.value)}
                    >
                        {districts.map((item) => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                    </select>
                </label>

                {district && (
                    <ChurchLookup
                        regionId={district.regionId}
                        districtId={district.id}
                        showTips={ChurchSearchTips.Basic}
                        startWithSearch={false}
                        onSelect={(_, church) => onSelect(church)}
                    />
                )}

                <div className="modal-action">
                    <button type="button" className="btn btn-warning mt-0" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </dialog>
    );
}