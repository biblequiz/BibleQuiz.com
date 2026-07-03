import { useRef, useState } from "react";
import { useModalDialog } from "hooks/useModalDialog";
import { AuthManager } from "types/AuthManager";
import { PeopleService, Person, PersonParentType } from "types/services/PeopleService";
import { RequiredPersonFields } from "types/services/EventsService";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import type { Church } from "types/services/ChurchesService";
import { Address } from "types/services/models/Address";
import ChurchLookup, { ChurchSearchTips } from "components/ChurchLookup";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import stateData from "data/stateRegionsAndDistricts.json";

interface Props {
    /**
     * Title for the dialog.
     */
    title: string;

    /**
     * Person to edit. When null/undefined, a new person will be created.
     */
    existingPerson?: Person | null;

    /**
     * Type of the parent entity.
     */
    parentType: PersonParentType;

    /**
     * Id of the parent entity.
     */
    parentId?: string | null;

    /**
     * Event Id to use when inferring permissions for API calls.
     */
    eventId?: string | null;

    /**
     * Fields that are required. Fields not included will be shown as optional
     * unless hideOptionalFields is true.
     */
    requiredFields?: RequiredPersonFields;

    /**
     * When true, optional fields (those not in requiredFields) are hidden entirely.
     */
    hideOptionalFields?: boolean;

    /**
     * Pre-selected church. Used when parentType is Church so the church row is
     * omitted and this value is used directly.
     */
    currentChurch?: Church | null;

    /**
     * Region Id used to filter the inline church lookup.
     * Inferred automatically when parentType is Region.
     */
    newParentRegionId?: string;

    /**
     * District Id used to filter the inline church lookup.
     * Inferred automatically when parentType is District.
     */
    newParentDistrictId?: string;

    /**
     * Called when the dialog closes. Receives the saved person on success,
     * or null when the user cancels.
     */
    onClose: (person: Person | null) => void;
}

function hasField(requiredFields: RequiredPersonFields, flag: RequiredPersonFields): boolean {
    return DataTypeHelpers.hasEnumFlag(requiredFields, flag);
}

function shouldShow(requiredFields: RequiredPersonFields, flag: RequiredPersonFields, hideOptionalFields: boolean): boolean {
    return hasField(requiredFields, flag) || !hideOptionalFields;
}

/**
 * Formats a date-only string (any format parseable by DataTypeHelpers) into
 * the YYYY-MM-DD value expected by <input type="date">.
 */
function toInputDate(date: string | null | undefined): string {
    if (!date) return "";
    const parsed = DataTypeHelpers.parseDateOnly(date);
    if (!parsed) return "";
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export default function PersonDialog({
    title,
    existingPerson = null,
    parentType,
    parentId = null,
    eventId = null,
    requiredFields = RequiredPersonFields.None,
    hideOptionalFields = false,
    currentChurch = null,
    newParentRegionId,
    newParentDistrictId,
    onClose,
}: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const auth = AuthManager.useNanoStore();

    const [firstName, setFirstName] = useState(existingPerson?.FirstName ?? "");
    const [lastName, setLastName] = useState(existingPerson?.LastName ?? "");
    const [email, setEmail] = useState(existingPerson?.Email ?? "");
    const [dateOfBirth, setDateOfBirth] = useState(toInputDate(existingPerson?.DateOfBirth));
    const [phoneNumber, setPhoneNumber] = useState(existingPerson?.PhoneNumber ?? "");
    const [street, setStreet] = useState(existingPerson?.PhysicalAddress?.StreetAddress ?? "");
    const [city, setCity] = useState(existingPerson?.PhysicalAddress?.City ?? "");
    const [addressState, setAddressState] = useState(existingPerson?.PhysicalAddress?.State ?? "");
    const [zip, setZip] = useState(
        existingPerson?.PhysicalAddress?.ZipCode != null
            ? DataTypeHelpers.formatZipCode(existingPerson.PhysicalAddress.ZipCode)
            : ""
    );

    const initialChurch =
        parentType === PersonParentType.Church
            ? currentChurch
            : (existingPerson?.CurrentChurch ?? null);
    const initialChurchId =
        parentType === PersonParentType.Church
            ? (parentId ?? null)
            : (existingPerson?.CurrentChurchId ?? null);

    const [churchId, setChurchId] = useState<string | null>(initialChurchId);
    const [church, setChurch] = useState<Church | null>(initialChurch);
    const [churchDisplay, setChurchDisplay] = useState<string>(() => {
        const c = initialChurch;
        if (!c) return "";
        return `${c.Name} (${c.PhysicalAddress.City}, ${c.PhysicalAddress.State})`;
    });

    const [isSaving, setIsSaving] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const showEmail = shouldShow(requiredFields, RequiredPersonFields.Email, hideOptionalFields);
    const emailRequired = hasField(requiredFields, RequiredPersonFields.Email);
    const showBirthdate = shouldShow(requiredFields, RequiredPersonFields.DateOfBirth, hideOptionalFields);
    const birthdateRequired = hasField(requiredFields, RequiredPersonFields.DateOfBirth);
    const showPhone = shouldShow(requiredFields, RequiredPersonFields.PhoneNumber, hideOptionalFields);
    const phoneRequired = hasField(requiredFields, RequiredPersonFields.PhoneNumber);
    const showAddress = shouldShow(requiredFields, RequiredPersonFields.Address, hideOptionalFields);
    const addressRequired = hasField(requiredFields, RequiredPersonFields.Address);
    const showChurch = parentType !== PersonParentType.Church;

    // Church lookup region/district filtering mirrors the legacy PersonPage logic:
    // when the parent IS a region or district, filter by that parent's id directly.
    const churchRegionId =
        parentType === PersonParentType.Region ? (parentId ?? undefined) : newParentRegionId;
    const churchDistrictId =
        parentType === PersonParentType.District ? (parentId ?? undefined) : newParentDistrictId;

    useModalDialog(dialogRef, () => onClose(null), isSaving);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        event.stopPropagation();

        if (showChurch && !churchId) {
            setValidationError("Please select a church.");
            return;
        }

        if (showBirthdate && dateOfBirth) {
            const parsed = DataTypeHelpers.parseDateOnly(dateOfBirth);
            if (!parsed || parsed >= new Date()) {
                setValidationError("Please enter a valid past date for date of birth.");
                return;
            }
        }

        setValidationError(null);
        setIsSaving(true);

        const person = new Person();
        if (existingPerson) {
            person.Id = existingPerson.Id;
        }
        person.FirstName = firstName.trim();
        person.LastName = lastName.trim();
        person.Email = DataTypeHelpers.trimToNull(email) ?? "";
        person.DateOfBirth = showBirthdate
            ? DataTypeHelpers.trimToNull(dateOfBirth)
            : (existingPerson?.DateOfBirth ?? null);
        person.PhoneNumber = showPhone
            ? DataTypeHelpers.trimToNull(phoneNumber)
            : (existingPerson?.PhoneNumber ?? null);
        person.CurrentChurchId = churchId;
        person.CurrentChurch = church;

        if (showAddress) {
            const address = new Address();
            address.StreetAddress = street.trim();
            address.City = city.trim();
            address.State = addressState;
            address.ZipCode = zip ? parseInt(zip.replace(/\D/g, ""), 10) : null;
            person.PhysicalAddress = address;
        } else {
            person.PhysicalAddress = existingPerson?.PhysicalAddress ?? null;
        }

        try {
            const saved = existingPerson
                ? await PeopleService.update(auth, person, null, eventId)
                : await PeopleService.create(auth, person, eventId);
            onClose(saved);
        } catch (err: unknown) {
            setIsSaving(false);
            setValidationError((err as { message?: string })?.message ?? "An error occurred while saving.");
        }
    };

    const today = new Date().toISOString().split("T")[0];

    return (
        <dialog ref={dialogRef} className="modal">
            <div className="modal-box w-full max-w-2xl">
                <h3 className="font-bold text-lg">{title}</h3>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 mt-2"
                    onClick={() => { onClose(null); dialogRef.current?.close(); }}
                >✕</button>

                {validationError && (
                    <div role="alert" className="alert alert-error mt-4 mb-0 w-full">
                        <FontAwesomeIcon icon="fas faCircleExclamation" />
                        <span><b>Error: </b>{validationError}</span>
                    </div>
                )}

                <form ref={formRef} className="mt-4 space-y-4" onSubmit={handleSubmit}>
                    <div className="w-full">
                        <label className="label">
                            <span className="label-text font-semibold">First Name</span>
                            <span className="label-text-alt text-error">*</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full mt-0"
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            required
                            disabled={isSaving}
                        />
                    </div>

                    <div className="w-full">
                        <label className="label">
                            <span className="label-text font-semibold">Last Name</span>
                            <span className="label-text-alt text-error">*</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full mt-0"
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            required
                            disabled={isSaving}
                        />
                    </div>

                    {showEmail && (
                        <div className="w-full">
                            <label className="label">
                                <span className="label-text font-semibold">Email</span>
                                {emailRequired && <span className="label-text-alt text-error">*</span>}
                            </label>
                            <input
                                type="email"
                                className="input input-bordered w-full mt-0"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required={emailRequired}
                                disabled={isSaving}
                            />
                        </div>
                    )}

                    {showBirthdate && (
                        <div className="w-full">
                            <label className="label">
                                <span className="label-text font-semibold">Date of Birth</span>
                                {birthdateRequired && <span className="label-text-alt text-error">*</span>}
                            </label>
                            <input
                                type="date"
                                className="input input-bordered w-full mt-0"
                                value={dateOfBirth}
                                onChange={e => setDateOfBirth(e.target.value)}
                                required={birthdateRequired}
                                max={today}
                                disabled={isSaving}
                            />
                        </div>
                    )}

                    {showPhone && (
                        <div className="w-full">
                            <label className="label">
                                <span className="label-text font-semibold">Phone Number</span>
                                {phoneRequired && <span className="label-text-alt text-error">*</span>}
                            </label>
                            <input
                                type="tel"
                                className="input input-bordered w-full mt-0"
                                value={phoneNumber ?? ""}
                                onChange={e => setPhoneNumber(e.target.value)}
                                required={phoneRequired}
                                disabled={isSaving}
                            />
                        </div>
                    )}

                    {showAddress && (
                        <>
                            <div className="w-full">
                                <label className="label">
                                    <span className="label-text font-semibold">Address</span>
                                    {addressRequired && <span className="label-text-alt text-error">*</span>}
                                </label>
                                <input
                                    type="text"
                                    placeholder="Street Address"
                                    className="input input-bordered w-full mt-0"
                                    value={street}
                                    onChange={e => setStreet(e.target.value)}
                                    required={addressRequired}
                                    disabled={isSaving}
                                />
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                <input
                                    type="text"
                                    placeholder="City"
                                    className="input input-bordered w-full mt-0 col-span-2"
                                    value={city}
                                    onChange={e => setCity(e.target.value)}
                                    required={addressRequired}
                                    disabled={isSaving}
                                />
                                <select
                                    className="select select-bordered w-full mt-0"
                                    value={addressState}
                                    onChange={e => setAddressState(e.target.value)}
                                    required={addressRequired}
                                    disabled={isSaving}
                                >
                                    <option value="" disabled={addressRequired}></option>
                                    {stateData.map(s => (
                                        <option key={s.code} value={s.code}>{s.code}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    className="input input-bordered w-full mt-0"
                                    value={zip}
                                    placeholder="Zip"
                                    onChange={e => setZip(e.target.value)}
                                    required={addressRequired}
                                    pattern="[0-9]{5}"
                                    maxLength={5}
                                    disabled={isSaving}
                                />
                            </div>
                        </>
                    )}

                    {showChurch && (
                        <div className="w-full">
                            <label className="label">
                                <span className="label-text font-semibold">Church</span>
                                <span className="label-text-alt text-error">*</span>
                            </label>
                            {churchId ? (
                                <div className="flex items-center gap-2">
                                    <span className="input input-bordered flex-1 flex items-center text-sm">
                                        {churchDisplay}
                                    </span>
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        title="Clear church"
                                        onClick={() => { setChurchId(null); setChurch(null); setChurchDisplay(""); }}
                                        disabled={isSaving}
                                    >
                                        <FontAwesomeIcon icon="fas faXmark" />
                                    </button>
                                </div>
                            ) : (
                                <ChurchLookup
                                    regionId={churchRegionId}
                                    districtId={churchDistrictId}
                                    showTips={ChurchSearchTips.None}
                                    required={true}
                                    disabled={isSaving}
                                    onSelect={(selected, info) => {
                                        setChurchId(selected.id);
                                        setChurch(info);
                                        setChurchDisplay(selected.displayName);
                                    }}
                                />
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="submit"
                            className="btn btn-primary mt-0 mb-0"
                            disabled={isSaving}
                        >
                            {isSaving
                                ? (<><span className="loading loading-spinner loading-xs"></span> Saving...</>)
                                : (<><FontAwesomeIcon icon="fas faFloppyDisk" classNames={["mr-1"]} /> Save</>)}
                        </button>
                        <button
                            type="button"
                            className="btn btn-warning mt-0 mb-0"
                            onClick={() => { onClose(null); dialogRef.current?.close(); }}
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </dialog>
    );
}
