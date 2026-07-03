import { useEffect, useMemo, useRef, useState } from 'react';
import { PeopleService } from 'types/services/PeopleService';
import { ChurchesService } from 'types/services/ChurchesService';
import type { AuthManager } from 'types/AuthManager';
import type { Person } from 'types/services/PeopleService';
import type { Church } from 'types/services/ChurchesService';
import FontAwesomeIcon from 'components/FontAwesomeIcon';
import ConfirmationDialog from 'components/ConfirmationDialog';
import { DataTypeHelpers } from 'utils/DataTypeHelpers';
import { sharedGlobalStatusToast } from 'utils/SharedState';

interface Props {
    canShow: boolean;
    mergeType: 'people' | 'church';
    firstItem?: Person | Church | null;
    secondItem?: Person | Church | null;
    onClear: (item: 'first' | 'second' | 'all') => void;
    auth: AuthManager;
    onMergeComplete?: () => void;
}

type MergeSource = 'first' | 'second';

interface MergeFieldDefinition {
    key: string;
    label: string;
    firstDisplay: string;
    secondDisplay: string;
    firstIsEmpty: boolean;
    secondIsEmpty: boolean;
    isEqual: boolean;
    defaultSource: MergeSource;
}

interface NormalizedAddress {
    street: string | null;
    city: string | null;
    state: string | null;
    zip: number | null;
}

const EMPTY_LABEL = 'Empty';
const ZIP_CODE_PATTERN = /^\d{5}$/;

function normalizeString(value: string | null | undefined): string | null {
    return DataTypeHelpers.trimToNull(value);
}

function normalizeAddress(
    address: Person['PhysicalAddress'] | Church['PhysicalAddress'] | null | undefined
): NormalizedAddress {
    const rawZip = address?.ZipCode;
    return {
        street: normalizeString(address?.StreetAddress),
        city: normalizeString(address?.City),
        state: normalizeString(address?.State),
        zip: rawZip == null || Number.isNaN(rawZip) ? null : Number(rawZip)
    };
}

function isAddressEmpty(address: NormalizedAddress): boolean {
    return !address.street && !address.city && !address.state && address.zip == null;
}

function isAddressPartial(address: NormalizedAddress): boolean {
    if (isAddressEmpty(address)) return false;
    return !address.street || !address.city || !address.state || address.zip == null;
}

function areAddressesEqual(a: NormalizedAddress, b: NormalizedAddress): boolean {
    return a.street === b.street && a.city === b.city && a.state === b.state && a.zip === b.zip;
}

function formatAddress(address: NormalizedAddress): string {
    const formatted = DataTypeHelpers.formatAddress({
        StreetAddress: address.street ?? '',
        City: address.city ?? '',
        State: address.state ?? '',
        ZipCode: address.zip
    });

    return formatted ?? EMPTY_LABEL;
}

function getFieldDefault(
    firstIsEmpty: boolean,
    secondIsEmpty: boolean,
    fallback: MergeSource
): MergeSource {
    if (firstIsEmpty && !secondIsEmpty) return 'second';
    if (!firstIsEmpty && secondIsEmpty) return 'first';
    return fallback;
}

function formatItemDisplay(item: Person | Church | null | undefined): string {
    if (!item) return '';
    if ('CurrentChurch' in item) {
        return `${(item as Person).FirstName ?? ''} ${(item as Person).LastName ?? ''}`.trim();
    }

    return `${(item as Church).Name ?? ''}`.trim();
}

function formatChurchValue(church: Church | null | undefined): string {
    const name = normalizeString(church?.Name);
    const city = normalizeString(church?.PhysicalAddress?.City);
    const state = normalizeString(church?.PhysicalAddress?.State);
    if (!name && !city && !state) return EMPTY_LABEL;
    if (!city && !state) return name ?? EMPTY_LABEL;

    return `${name ?? EMPTY_LABEL} (${city ?? ''}${city && state ? ', ' : ''}${state ?? ''})`;
}

function isChurchValueEmpty(church: Church | null | undefined): boolean {
    return !normalizeString(church?.Id ?? null);
}

export default function MergePanel({
    canShow,
    mergeType,
    firstItem,
    secondItem,
    onClear,
    auth,
    onMergeComplete
}: Props) {
    const [isReviewing, setIsReviewing] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isMerging, setIsMerging] = useState(false);
    const [survivorSource, setSurvivorSource] = useState<MergeSource>('first');
    const [selectedSources, setSelectedSources] = useState<Record<string, MergeSource>>({});
    const [showAllFields, setShowAllFields] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [error, setError] = useState<string | undefined>(undefined);
    const reviewDialogRef = useRef<HTMLDialogElement>(null);

    const hasMergeSelection = !!canShow && !!firstItem && !!secondItem;

    useEffect(() => {
        const dialog = reviewDialogRef.current;
        if (!dialog) return;

        if (isReviewing) {
            if (!dialog.open) {
                dialog.showModal();
            }
            return;
        }

        if (dialog.open) {
            dialog.close();
        }
    }, [isReviewing]);

    const isPeopleMerge = mergeType === 'people';
    const firstPerson = isPeopleMerge ? (firstItem as Person) : null;
    const secondPerson = isPeopleMerge ? (secondItem as Person) : null;
    const firstChurch = !isPeopleMerge ? (firstItem as Church) : null;
    const secondChurch = !isPeopleMerge ? (secondItem as Church) : null;

    const defaultFieldDefinitions = useMemo<MergeFieldDefinition[]>(() => {
        if (isPeopleMerge && firstPerson && secondPerson) {
            const firstAddress = normalizeAddress(firstPerson.PhysicalAddress);
            const secondAddress = normalizeAddress(secondPerson.PhysicalAddress);
            const firstAddressEmpty = isAddressEmpty(firstAddress);
            const secondAddressEmpty = isAddressEmpty(secondAddress);
            const addressesEqual = areAddressesEqual(firstAddress, secondAddress);
            const hasPartialAddressMismatch =
                !addressesEqual &&
                !firstAddressEmpty &&
                !secondAddressEmpty &&
                (isAddressPartial(firstAddress) || isAddressPartial(secondAddress));

            return [
                {
                    key: 'firstName',
                    label: 'First Name',
                    firstDisplay: normalizeString(firstPerson.FirstName) ?? EMPTY_LABEL,
                    secondDisplay: normalizeString(secondPerson.FirstName) ?? EMPTY_LABEL,
                    firstIsEmpty: !normalizeString(firstPerson.FirstName),
                    secondIsEmpty: !normalizeString(secondPerson.FirstName),
                    isEqual: normalizeString(firstPerson.FirstName) === normalizeString(secondPerson.FirstName),
                    defaultSource: 'first'
                },
                {
                    key: 'lastName',
                    label: 'Last Name',
                    firstDisplay: normalizeString(firstPerson.LastName) ?? EMPTY_LABEL,
                    secondDisplay: normalizeString(secondPerson.LastName) ?? EMPTY_LABEL,
                    firstIsEmpty: !normalizeString(firstPerson.LastName),
                    secondIsEmpty: !normalizeString(secondPerson.LastName),
                    isEqual: normalizeString(firstPerson.LastName) === normalizeString(secondPerson.LastName),
                    defaultSource: 'first'
                },
                {
                    key: 'email',
                    label: 'Email',
                    firstDisplay: normalizeString(firstPerson.Email) ?? EMPTY_LABEL,
                    secondDisplay: normalizeString(secondPerson.Email) ?? EMPTY_LABEL,
                    firstIsEmpty: !normalizeString(firstPerson.Email),
                    secondIsEmpty: !normalizeString(secondPerson.Email),
                    isEqual: normalizeString(firstPerson.Email) === normalizeString(secondPerson.Email),
                    defaultSource: 'first'
                },
                {
                    key: 'dateOfBirth',
                    label: 'Date of Birth',
                    firstDisplay: normalizeString(firstPerson.DateOfBirth) ?? EMPTY_LABEL,
                    secondDisplay: normalizeString(secondPerson.DateOfBirth) ?? EMPTY_LABEL,
                    firstIsEmpty: !normalizeString(firstPerson.DateOfBirth),
                    secondIsEmpty: !normalizeString(secondPerson.DateOfBirth),
                    isEqual: normalizeString(firstPerson.DateOfBirth) === normalizeString(secondPerson.DateOfBirth),
                    defaultSource: 'first'
                },
                {
                    key: 'phoneNumber',
                    label: 'Phone Number',
                    firstDisplay: normalizeString(firstPerson.PhoneNumber) ?? EMPTY_LABEL,
                    secondDisplay: normalizeString(secondPerson.PhoneNumber) ?? EMPTY_LABEL,
                    firstIsEmpty: !normalizeString(firstPerson.PhoneNumber),
                    secondIsEmpty: !normalizeString(secondPerson.PhoneNumber),
                    isEqual: normalizeString(firstPerson.PhoneNumber) === normalizeString(secondPerson.PhoneNumber),
                    defaultSource: 'first'
                },
                {
                    key: 'currentChurch',
                    label: 'Church',
                    firstDisplay: formatChurchValue(firstPerson.CurrentChurch),
                    secondDisplay: formatChurchValue(secondPerson.CurrentChurch),
                    firstIsEmpty: isChurchValueEmpty(firstPerson.CurrentChurch),
                    secondIsEmpty: isChurchValueEmpty(secondPerson.CurrentChurch),
                    isEqual: normalizeString(firstPerson.CurrentChurch?.Id ?? null) === normalizeString(secondPerson.CurrentChurch?.Id ?? null),
                    defaultSource: 'first'
                },
                {
                    key: 'address',
                    label: 'Address',
                    firstDisplay: formatAddress(firstAddress),
                    secondDisplay: formatAddress(secondAddress),
                    firstIsEmpty: firstAddressEmpty,
                    secondIsEmpty: secondAddressEmpty,
                    isEqual: addressesEqual,
                    defaultSource: hasPartialAddressMismatch
                        ? 'first'
                        : getFieldDefault(firstAddressEmpty, secondAddressEmpty, 'first')
                }
            ];
        }

        if (firstChurch && secondChurch) {
            const firstAddress = normalizeAddress(firstChurch.PhysicalAddress);
            const secondAddress = normalizeAddress(secondChurch.PhysicalAddress);
            const firstAddressEmpty = isAddressEmpty(firstAddress);
            const secondAddressEmpty = isAddressEmpty(secondAddress);
            const addressesEqual = areAddressesEqual(firstAddress, secondAddress);
            const hasPartialAddressMismatch =
                !addressesEqual &&
                !firstAddressEmpty &&
                !secondAddressEmpty &&
                (isAddressPartial(firstAddress) || isAddressPartial(secondAddress));

            return [
                {
                    key: 'name',
                    label: 'Name',
                    firstDisplay: normalizeString(firstChurch.Name) ?? EMPTY_LABEL,
                    secondDisplay: normalizeString(secondChurch.Name) ?? EMPTY_LABEL,
                    firstIsEmpty: !normalizeString(firstChurch.Name),
                    secondIsEmpty: !normalizeString(secondChurch.Name),
                    isEqual: normalizeString(firstChurch.Name) === normalizeString(secondChurch.Name),
                    defaultSource: 'first'
                },
                {
                    key: 'districtId',
                    label: 'District',
                    firstDisplay: normalizeString(firstChurch.DistrictId) ?? EMPTY_LABEL,
                    secondDisplay: normalizeString(secondChurch.DistrictId) ?? EMPTY_LABEL,
                    firstIsEmpty: !normalizeString(firstChurch.DistrictId),
                    secondIsEmpty: !normalizeString(secondChurch.DistrictId),
                    isEqual: normalizeString(firstChurch.DistrictId) === normalizeString(secondChurch.DistrictId),
                    defaultSource: 'first'
                },
                {
                    key: 'address',
                    label: 'Address',
                    firstDisplay: formatAddress(firstAddress),
                    secondDisplay: formatAddress(secondAddress),
                    firstIsEmpty: firstAddressEmpty,
                    secondIsEmpty: secondAddressEmpty,
                    isEqual: addressesEqual,
                    defaultSource: hasPartialAddressMismatch
                        ? 'first'
                        : getFieldDefault(firstAddressEmpty, secondAddressEmpty, 'first')
                }
            ];
        }

        return [];
    }, [isPeopleMerge, firstPerson, secondPerson, firstChurch, secondChurch]);

    const fieldDefinitions = useMemo(
        () => defaultFieldDefinitions.map(field => ({
            ...field,
            defaultSource: field.key === 'address'
                ? field.defaultSource
                : getFieldDefault(field.firstIsEmpty, field.secondIsEmpty, survivorSource)
        })),
        [defaultFieldDefinitions, survivorSource]
    );

    const visibleFields = useMemo(
        () => showAllFields ? fieldDefinitions : fieldDefinitions.filter(field => !field.isEqual),
        [fieldDefinitions, showAllFields]
    );

    const unchangedFieldCount = fieldDefinitions.filter(field => field.isEqual).length;

    const recomputeDefaults = (nextSurvivor: MergeSource) => {
        const nextSelections: Record<string, MergeSource> = {};
        for (const field of defaultFieldDefinitions) {
            nextSelections[field.key] = field.key === 'address'
                ? field.defaultSource
                : getFieldDefault(field.firstIsEmpty, field.secondIsEmpty, nextSurvivor);
        }

        setSelectedSources(nextSelections);
        setValidationErrors([]);
    };

    const resolvedSourceFor = (fieldKey: string): MergeSource => {
        const field = fieldDefinitions.find(item => item.key === fieldKey);
        if (!field) return 'first';
        return selectedSources[fieldKey] ?? field.defaultSource;
    };

    const resolveBySource = <T,>(firstValue: T, secondValue: T, source: MergeSource): T => {
        return source === 'first' ? firstValue : secondValue;
    };

    const validatePerson = (person: Person): string[] => {
        const errors: string[] = [];

        if (!normalizeString(person.FirstName)) errors.push('First Name is required.');
        if (!normalizeString(person.LastName)) errors.push('Last Name is required.');

        const email = normalizeString(person.Email);
        if (email && !/^\S+@\S+\.\S+$/.test(email)) {
            errors.push('Email must be valid.');
        }

        const dateOfBirth = normalizeString(person.DateOfBirth);
        if (dateOfBirth) {
            const parsed = DataTypeHelpers.parseDateOnly(dateOfBirth);
            if (!parsed || parsed >= DataTypeHelpers.nowDateOnly) {
                errors.push('Date of Birth must be a valid past date.');
            }
        }

        if (!normalizeString(person.CurrentChurchId)) {
            errors.push('Church is required.');
        }

        const address = normalizeAddress(person.PhysicalAddress);
        if (!isAddressEmpty(address)) {
            if (!address.street || !address.city || !address.state || address.zip == null) {
                errors.push('Address must include street, city, state, and zip or be completely empty.');
            } else {
                const zipText = DataTypeHelpers.formatZipCode(address.zip);
                if (!ZIP_CODE_PATTERN.test(zipText)) {
                    errors.push('Zip must be a valid 5-digit value.');
                }
            }
        }

        return errors;
    };

    const validateChurch = (church: Church): string[] => {
        const errors: string[] = [];

        if (!normalizeString(church.Name)) errors.push('Church Name is required.');
        if (!normalizeString(church.DistrictId)) errors.push('District is required.');

        const address = normalizeAddress(church.PhysicalAddress);
        if (isAddressEmpty(address)) {
            errors.push('Address is required.');
        } else {
            if (!address.street || !address.city || !address.state || address.zip == null) {
                errors.push('Address must include street, city, state, and zip.');
            } else {
                const zipText = DataTypeHelpers.formatZipCode(address.zip);
                if (!ZIP_CODE_PATTERN.test(zipText)) {
                    errors.push('Zip must be a valid 5-digit value.');
                }
            }
        }

        return errors;
    };

    const buildResolvedMerge = () => {
        if (isPeopleMerge && firstPerson && secondPerson) {
            const survivor = survivorSource === 'first' ? firstPerson : secondPerson;
            const losingId = survivorSource === 'first' ? secondPerson.Id : firstPerson.Id;
            const resolved: Person = { ...survivor };

            resolved.FirstName = resolveBySource(firstPerson.FirstName, secondPerson.FirstName, resolvedSourceFor('firstName'));
            resolved.LastName = resolveBySource(firstPerson.LastName, secondPerson.LastName, resolvedSourceFor('lastName'));
            resolved.Email = resolveBySource(firstPerson.Email, secondPerson.Email, resolvedSourceFor('email'));
            resolved.DateOfBirth = resolveBySource(firstPerson.DateOfBirth, secondPerson.DateOfBirth, resolvedSourceFor('dateOfBirth'));
            resolved.PhoneNumber = resolveBySource(firstPerson.PhoneNumber, secondPerson.PhoneNumber, resolvedSourceFor('phoneNumber'));

            const churchSource = resolvedSourceFor('currentChurch');
            resolved.CurrentChurch = churchSource === 'first' ? firstPerson.CurrentChurch : secondPerson.CurrentChurch;
            resolved.CurrentChurchId = resolved.CurrentChurch?.Id ?? null;

            const addressSource = resolvedSourceFor('address');
            const sourceAddress = addressSource === 'first' ? firstPerson.PhysicalAddress : secondPerson.PhysicalAddress;
            resolved.PhysicalAddress = sourceAddress ? { ...sourceAddress } : null;

            return {
                type: 'people' as const,
                resolved,
                losingId,
                errors: validatePerson(resolved)
            };
        }

        if (!isPeopleMerge && firstChurch && secondChurch) {
            const survivor = survivorSource === 'first' ? firstChurch : secondChurch;
            const losingId = survivorSource === 'first' ? secondChurch.Id : firstChurch.Id;
            const resolved: Church = { ...survivor };

            resolved.Name = resolveBySource(firstChurch.Name, secondChurch.Name, resolvedSourceFor('name'));
            resolved.DistrictId = resolveBySource(firstChurch.DistrictId, secondChurch.DistrictId, resolvedSourceFor('districtId'));

            const addressSource = resolvedSourceFor('address');
            const sourceAddress = addressSource === 'first' ? firstChurch.PhysicalAddress : secondChurch.PhysicalAddress;
            resolved.PhysicalAddress = sourceAddress ? { ...sourceAddress } : ({
                StreetAddress: '',
                City: '',
                State: '',
                ZipCode: null
            });

            return {
                type: 'church' as const,
                resolved,
                losingId,
                errors: validateChurch(resolved)
            };
        }

        return null;
    };

    const mergeSummary = {
        survivor: survivorSource === 'first' ? formatItemDisplay(firstItem) : formatItemDisplay(secondItem),
        merged: survivorSource === 'first' ? formatItemDisplay(secondItem) : formatItemDisplay(firstItem)
    };

    const handleContinueToConfirmation = () => {
        const mergeData = buildResolvedMerge();
        if (!mergeData) return;

        if (mergeData.errors.length > 0) {
            setValidationErrors(mergeData.errors);
            return;
        }

        setValidationErrors([]);
        setIsConfirming(true);
    };

    const handleMerge = async () => {
        const mergeData = buildResolvedMerge();
        if (!mergeData) return;
        if (mergeData.errors.length > 0) {
            setValidationErrors(mergeData.errors);
            setIsConfirming(false);
            return;
        }

        setIsMerging(true);
        setError(undefined);
        try {
            let firstSourceCount = 0;
            let secondSourceCount = 0;
            for (const field of fieldDefinitions) {
                const source = resolvedSourceFor(field.key);
                if (source === 'first') {
                    firstSourceCount++;
                } else {
                    secondSourceCount++;
                }
            }

            if (mergeData.type === 'people') {
                await PeopleService.update(auth, mergeData.resolved, mergeData.losingId);
            } else {
                await ChurchesService.update(auth, mergeData.resolved, mergeData.losingId);
            }

            sharedGlobalStatusToast.set({
                type: 'success',
                title: 'Merge Complete',
                icon: 'fas faCircleCheck',
                message: `${mergeSummary.survivor} kept the merged record from ${mergeSummary.merged}. Selected values: ${firstSourceCount} from First, ${secondSourceCount} from Second.`,
                timeout: 10000
            });

            setIsConfirming(false);
            setIsReviewing(false);
            setValidationErrors([]);
            setShowAllFields(false);
            onClear('all');
            onMergeComplete?.();
        } catch (err) {
            setError((err as any).message || 'Failed to merge');
            setIsConfirming(false);
        } finally {
            setIsMerging(false);
        }
    };

    if (!hasMergeSelection) {
        return null;
    }

    return (
        <>
            <div className="card bg-base-200 shadow-md">
                <div className="card-body">
                    <h3 className="card-title">
                        <FontAwesomeIcon icon="fas faCompressAlt" />
                        Merge {mergeType === 'people' ? 'People' : 'Churches'}
                    </h3>
                    <p className="text-sm text-base-content/70 mb-4">
                        {mergeType === 'people'
                            ? 'Select two people from the list below, then review merged field values before final confirmation.'
                            : 'Select two churches from the list below, then review merged field values before final confirmation.'}
                    </p>

                    {error && (
                        <div role="alert" className="alert alert-error mb-4">
                            <FontAwesomeIcon icon="fas faCircleExclamation" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-3 mt-0 mb-0">
                        <div className="mt-0 mb-0">
                            <label className="label mt-0 mb-0">
                                <span className="label-text">First {mergeType === 'people' ? 'Person' : 'Church'}</span>
                            </label>
                            <div className="input-group mt-0 mb-0">
                                <input
                                    type="text"
                                    value={formatItemDisplay(firstItem)}
                                    className="input input-bordered flex-1"
                                    disabled
                                />
                                <button
                                    className="btn btn-ghost"
                                    title="Clear"
                                    onClick={() => onClear('first')}
                                >
                                    <FontAwesomeIcon icon="fas faXmark" />
                                </button>
                            </div>
                        </div>

                        <div className="mt-0 mb-0">
                            <label className="label mt-0 mb-0">
                                <span className="label-text">Second {mergeType === 'people' ? 'Person' : 'Church'}</span>
                            </label>
                            <div className="input-group mt-0 mb-0">
                                <input
                                    type="text"
                                    value={formatItemDisplay(secondItem)}
                                    className="input input-bordered flex-1"
                                    disabled
                                />
                                <button
                                    className="btn btn-ghost"
                                    title="Clear"
                                    onClick={() => onClear('second')}
                                >
                                    <FontAwesomeIcon icon="fas faXmark" />
                                </button>
                            </div>
                        </div>

                        <button
                            className="btn btn-warning text-white w-full"
                            onClick={() => {
                                setSurvivorSource('first');
                                setShowAllFields(false);
                                setError(undefined);
                                recomputeDefaults('first');
                                setIsReviewing(true);
                            }}
                            disabled={isMerging}
                        >
                            <FontAwesomeIcon icon="fas faCompressAlt" />
                            Review Merge
                        </button>
                    </div>
                </div>
            </div>

            {isReviewing && (
                <dialog
                    ref={reviewDialogRef}
                    className="modal"
                    onClose={() => {
                        setIsReviewing(false);
                        setValidationErrors([]);
                    }}
                >
                    <div className="modal-box w-11/12 max-w-5xl">
                        <h3 className="font-bold text-lg">
                            Merge Review: {mergeType === 'people' ? 'People' : 'Churches'}
                        </h3>
                        <p className="text-sm text-base-content/70 mt-2">
                            Choose the merged and per-field values before merging.
                        </p>

                        {(error || validationErrors.length > 0) && (
                            <div role="alert" className="alert alert-error mt-4">
                                <FontAwesomeIcon icon="fas faCircleExclamation" />
                                <div>
                                    {error && <div>{error}</div>}
                                    {validationErrors.map(validationError => (
                                        <div key={validationError}>{validationError}</div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-4 p-3 bg-base-200 rounded-lg">
                            <div className="font-semibold">Merged Fields</div>
                            <div className="join w-full mt-2" role="radiogroup" aria-label="Survivor">
                                <button
                                    type="button"
                                    role="radio"
                                    aria-checked={survivorSource === 'first'}
                                    className={`join-item btn flex-1 ${survivorSource === 'first' ? 'btn-primary' : 'btn-outline'}`}
                                    onClick={() => {
                                        setSurvivorSource('first');
                                        recomputeDefaults('first');
                                    }}
                                >
                                    <span className="badge badge-sm mr-2">First</span>
                                    <span className="truncate">{formatItemDisplay(firstItem)}</span>
                                </button>
                                <button
                                    type="button"
                                    role="radio"
                                    aria-checked={survivorSource === 'second'}
                                    className={`join-item btn flex-1 ${survivorSource === 'second' ? 'btn-primary' : 'btn-outline'}`}
                                    onClick={() => {
                                        setSurvivorSource('second');
                                        recomputeDefaults('second');
                                    }}
                                >
                                    <span className="badge badge-sm mr-2">Second</span>
                                    <span className="truncate">{formatItemDisplay(secondItem)}</span>
                                </button>
                            </div>
                            <p className="text-xs mt-2">
                                Merged record: <strong>{mergeSummary.merged}</strong>
                            </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                            <div className="text-sm text-base-content/70">
                                {unchangedFieldCount > 0 ? `${unchangedFieldCount} unchanged field${unchangedFieldCount === 1 ? '' : 's'} hidden` : 'All fields currently shown'}
                            </div>
                            <div className="flex gap-2 mt-0 mb-0">
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm mt-0 mb-0"
                                    onClick={() => setShowAllFields(prev => !prev)}
                                >
                                    {showAllFields ? 'Hide Unchanged Fields' : 'Show All Fields'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm mt-0 mb-0"
                                    onClick={() => recomputeDefaults(survivorSource)}
                                >
                                    Reset to Defaults
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 max-h-[50vh] overflow-y-auto space-y-3">
                            {visibleFields.map(field => {
                                const selectedSource = resolvedSourceFor(field.key);
                                return (
                                    <div key={field.key} className="border border-base-300 rounded-lg p-3">
                                        <div className="font-semibold mb-2">{field.label}</div>
                                        <div className="join w-full mt-0 mb-0" role="radiogroup" aria-label={field.label}>
                                            <button
                                                type="button"
                                                role="radio"
                                                aria-checked={selectedSource === 'first'}
                                                className={`join-item btn flex-1 h-auto min-h-0 py-2 px-3 ${selectedSource === 'first' ? 'btn-primary' : 'btn-outline'}`}
                                                onClick={() => setSelectedSources(prev => ({ ...prev, [field.key]: 'first' }))}
                                            >
                                                <div className="w-full text-left">
                                                    <span className="badge badge-sm mb-1">First</span>
                                                    <div className="whitespace-normal break-words">{field.firstDisplay}</div>
                                                </div>
                                            </button>
                                            <button
                                                type="button"
                                                role="radio"
                                                aria-checked={selectedSource === 'second'}
                                                className={`join-item btn flex-1 h-auto min-h-0 py-2 px-3 ${selectedSource === 'second' ? 'btn-primary' : 'btn-outline'}`}
                                                onClick={() => setSelectedSources(prev => ({ ...prev, [field.key]: 'second' }))}
                                            >
                                                <div className="w-full text-left">
                                                    <span className="badge badge-sm mb-1">Second</span>
                                                    <div className="whitespace-normal break-words">{field.secondDisplay}</div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="modal-action">
                            <button
                                type="button"
                                className="btn btn-primary mt-0 mb-0"
                                onClick={handleContinueToConfirmation}
                                disabled={isMerging}
                            >
                                Continue
                            </button>
                            <button
                                type="button"
                                className="btn btn-ghost mt-0 mb-0"
                                onClick={() => {
                                    setIsReviewing(false);
                                    setValidationErrors([]);
                                }}
                                disabled={isMerging}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </dialog>
            )}

            {isConfirming && (
                <ConfirmationDialog
                    title={`Merge ${mergeType === 'people' ? 'People' : 'Churches'}`}
                    yesLabel="Merge"
                    onYes={handleMerge}
                    noLabel="Cancel"
                    onNo={() => setIsConfirming(false)}
                >
                    <p className="font-bold mb-2">
                        ⚠️ This action CANNOT be undone. Any changes made as part of merging cannot be reversed.
                    </p>
                    <p className="mb-4">
                        <strong>{mergeSummary.survivor}</strong> will keep all records and <strong>{mergeSummary.merged}</strong> will be merged into it.
                    </p>
                    <p>Are you sure you want to continue?</p>
                </ConfirmationDialog>
            )}
        </>
    );
}
