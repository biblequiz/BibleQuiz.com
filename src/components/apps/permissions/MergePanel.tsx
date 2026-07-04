import { useEffect, useMemo, useRef, useState } from 'react';
import { PeopleService } from 'types/services/PeopleService';
import { ChurchesService } from 'types/services/ChurchesService';
import type { AuthManager } from 'types/AuthManager';
import type { Person } from 'types/services/PeopleService';
import type { Church } from 'types/services/ChurchesService';
import FontAwesomeIcon from 'components/FontAwesomeIcon';
import ChurchLookup, { ChurchSearchTips } from 'components/ChurchLookup';
import ConfirmationDialog from 'components/ConfirmationDialog';
import { DataTypeHelpers } from 'utils/DataTypeHelpers';
import { sharedGlobalStatusToast } from 'utils/SharedState';
import districts from 'data/districts.json';
import stateData from 'data/stateRegionsAndDistricts.json';
import type { DistrictInfo } from 'types/RegionAndDistricts';

interface Props {
    canShow: boolean;
    mergeType: 'people' | 'church';
    firstItem?: Person | Church | null;
    secondItem?: Person | Church | null;
    onClear: (item: 'first' | 'second' | 'all') => void;
    auth: AuthManager;
    onMergeComplete?: () => void;
}

type CandidateSource = 'first' | 'second';
type MergeSource = CandidateSource | 'manual';

interface MergeFieldDefinition {
    key: string;
    label: string;
    firstDisplay: string;
    secondDisplay: string;
    firstIsEmpty: boolean;
    secondIsEmpty: boolean;
    isEqual: boolean;
    defaultSource: CandidateSource;
}

interface NormalizedAddress {
    street: string | null;
    city: string | null;
    state: string | null;
    zip: number | null;
}

const EMPTY_LABEL = 'Empty';
const ZIP_CODE_PATTERN = /^\d{5}$/;
const DISTRICTS = districts as DistrictInfo[];
const PERSON_ADDRESS_STATES = (stateData as Array<{ code: string }>).map(state => state.code);
const DISTRICT_NAME_BY_ID: Record<string, string> = {};
const DISTRICTS_BY_STATE: Record<string, DistrictInfo[]> = {};
for (const district of DISTRICTS) {
    DISTRICT_NAME_BY_ID[district.id] = district.name;
    for (const state of district.states) {
        const existing = DISTRICTS_BY_STATE[state];
        if (existing) {
            existing.push(district);
        } else {
            DISTRICTS_BY_STATE[state] = [district];
        }
    }
}
const CHURCH_ADDRESS_STATES = Object.keys(DISTRICTS_BY_STATE).sort();

function formatDistrictDisplay(districtId: string | null | undefined): string {
    const normalizedDistrictId = normalizeString(districtId);
    if (!normalizedDistrictId) return EMPTY_LABEL;
    return DISTRICT_NAME_BY_ID[normalizedDistrictId] ?? normalizedDistrictId;
}

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
    fallback: CandidateSource
): CandidateSource {
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

function toInputDate(date: string | null | undefined): string {
    if (!date) return '';
    const parsed = DataTypeHelpers.parseDateOnly(date);
    if (!parsed) return '';
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function hasOwnValue(values: Record<string, string>, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(values, key);
}

function formatSuccessMessage(mergeType: Props['mergeType'], item: Person | Church): string {
    return `Successfully merged ${mergeType === 'people' ? 'person' : 'church'} ${formatItemDisplay(item)}.`;
}

function normalizeComparableAddress(address: Person['PhysicalAddress'] | Church['PhysicalAddress'] | null | undefined): NormalizedAddress {
    return normalizeAddress(address);
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
    const [survivorSource, setSurvivorSource] = useState<CandidateSource>('first');
    const [selectedSources, setSelectedSources] = useState<Record<string, MergeSource>>({});
    const [manualOverrides, setManualOverrides] = useState<Record<string, string>>({});
    const [manualChurch, setManualChurch] = useState<Church | null | undefined>(undefined);
    const [showAllFields, setShowAllFields] = useState(false);
    const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [error, setError] = useState<string | undefined>(undefined);
    const panelRef = useRef<HTMLDivElement>(null);
    const reviewDialogRef = useRef<HTMLDialogElement>(null);
    const previousPairKeyRef = useRef<string | null>(null);

    const hasMergeSelection = !!canShow && !!firstItem && !!secondItem;
    const pairKey = hasMergeSelection
        ? `${mergeType}:${firstItem?.Id ?? ''}:${secondItem?.Id ?? ''}`
        : null;

    useEffect(() => {
        if (!pairKey) {
            previousPairKeyRef.current = null;
            return;
        }

        if (previousPairKeyRef.current === pairKey) {
            return;
        }

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        panelRef.current?.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'center',
            inline: 'nearest'
        });
        previousPairKeyRef.current = pairKey;
    }, [pairKey]);

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
                    firstDisplay: formatDistrictDisplay(firstChurch.DistrictId),
                    secondDisplay: formatDistrictDisplay(secondChurch.DistrictId),
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

    const getFieldDefinitionsForSurvivor = (nextSurvivor: CandidateSource) => defaultFieldDefinitions.map(field => ({
            ...field,
            defaultSource: field.key === 'address'
                ? field.defaultSource
                : getFieldDefault(field.firstIsEmpty, field.secondIsEmpty, nextSurvivor)
        }));

    const fieldDefinitions = useMemo(
        () => getFieldDefinitionsForSurvivor(survivorSource),
        [defaultFieldDefinitions, survivorSource]
    );

    const visibleFields = useMemo(
        () => showAllFields ? fieldDefinitions : fieldDefinitions.filter(field => !field.isEqual),
        [fieldDefinitions, showAllFields]
    );

    const unchangedFieldCount = fieldDefinitions.filter(field => field.isEqual).length;

    const clearValidationErrors = () => {
        setValidationErrors([]);
    };

    const getDefaultSelections = (nextSurvivor: CandidateSource): Record<string, MergeSource> => {
        const nextSelections: Record<string, MergeSource> = {};
        for (const field of getFieldDefinitionsForSurvivor(nextSurvivor)) {
            nextSelections[field.key] = field.defaultSource;
        }

        return nextSelections;
    };

    const recomputeDefaults = (nextSurvivor: CandidateSource) => {
        const nextSelections = getDefaultSelections(nextSurvivor);
        setSelectedSources(nextSelections);
        setManualOverrides({});
        setManualChurch(undefined);
        setValidationErrors([]);
    };

    const getOverride = (key: string): string | undefined => {
        if (!hasOwnValue(manualOverrides, key)) return undefined;
        return manualOverrides[key];
    };

    const updateOverride = (key: string, value: string) => {
        clearValidationErrors();
        setManualOverrides(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const resolvedSourceFor = (fieldKey: string, nextSurvivor: CandidateSource = survivorSource, sourceSelections: Record<string, MergeSource> = selectedSources): MergeSource => {
        const field = getFieldDefinitionsForSurvivor(nextSurvivor).find(item => item.key === fieldKey);
        if (!field) return 'first';
        return sourceSelections[fieldKey] ?? field.defaultSource;
    };

    const resolveBySource = <T,>(firstValue: T, secondValue: T, source: CandidateSource): T => {
        return source === 'first' ? firstValue : secondValue;
    };

    const getCandidateChurch = (source: CandidateSource): Church | null => (
        source === 'first' ? firstPerson?.CurrentChurch ?? null : secondPerson?.CurrentChurch ?? null
    );

    const getCandidateAddress = (source: CandidateSource): Person['PhysicalAddress'] | Church['PhysicalAddress'] | null => {
        if (isPeopleMerge) {
            return source === 'first' ? firstPerson?.PhysicalAddress ?? null : secondPerson?.PhysicalAddress ?? null;
        }

        return source === 'first' ? firstChurch?.PhysicalAddress ?? null : secondChurch?.PhysicalAddress ?? null;
    };

    const getCandidateFieldValue = (fieldKey: string, source: CandidateSource): string => {
        if (isPeopleMerge && firstPerson && secondPerson) {
            switch (fieldKey) {
                case 'firstName':
                    return resolveBySource(firstPerson.FirstName ?? '', secondPerson.FirstName ?? '', source);
                case 'lastName':
                    return resolveBySource(firstPerson.LastName ?? '', secondPerson.LastName ?? '', source);
                case 'email':
                    return resolveBySource(firstPerson.Email ?? '', secondPerson.Email ?? '', source) ?? '';
                case 'dateOfBirth':
                    return toInputDate(resolveBySource(firstPerson.DateOfBirth, secondPerson.DateOfBirth, source));
                case 'phoneNumber':
                    return resolveBySource(firstPerson.PhoneNumber ?? '', secondPerson.PhoneNumber ?? '', source) ?? '';
                default:
                    return '';
            }
        }

        if (!isPeopleMerge && firstChurch && secondChurch) {
            switch (fieldKey) {
                case 'name':
                    return resolveBySource(firstChurch.Name ?? '', secondChurch.Name ?? '', source);
                case 'districtId':
                    return resolveBySource(firstChurch.DistrictId ?? '', secondChurch.DistrictId ?? '', source);
                default:
                    return '';
            }
        }

        return '';
    };

    const updateAddressStateOverride = (value: string) => {
        clearValidationErrors();
        setManualOverrides(prev => {
            const next: Record<string, string> = {
                ...prev,
                addressState: value
            };

            if (!isPeopleMerge && resolvedSourceFor('districtId') === 'manual') {
                const districtId = hasOwnValue(next, 'districtId') ? next.districtId : '';
                if (districtId && value && !(DISTRICTS_BY_STATE[value] ?? []).some(district => district.id === districtId)) {
                    next.districtId = '';
                }
            }

            return next;
        });
    };

    const prefillManualField = (fieldKey: string, source: CandidateSource) => {
        if (fieldKey === 'currentChurch') {
            setManualChurch(prev => prev === undefined ? getCandidateChurch(source) : prev);
            return;
        }

        if (fieldKey === 'address') {
            setManualOverrides(prev => {
                if (
                    hasOwnValue(prev, 'addressStreet') ||
                    hasOwnValue(prev, 'addressCity') ||
                    hasOwnValue(prev, 'addressState') ||
                    hasOwnValue(prev, 'addressZip')
                ) {
                    return prev;
                }

                const address = normalizeAddress(getCandidateAddress(source));
                return {
                    ...prev,
                    addressStreet: address.street ?? '',
                    addressCity: address.city ?? '',
                    addressState: address.state ?? '',
                    addressZip: address.zip == null ? '' : DataTypeHelpers.formatZipCode(address.zip)
                };
            });
            return;
        }

        setManualOverrides(prev => {
            if (hasOwnValue(prev, fieldKey)) {
                return prev;
            }

            return {
                ...prev,
                [fieldKey]: getCandidateFieldValue(fieldKey, source)
            };
        });
    };

    const updateSelectedSource = (fieldKey: string, source: MergeSource) => {
        clearValidationErrors();
        if (source === 'manual') {
            const currentSource = resolvedSourceFor(fieldKey);
            prefillManualField(fieldKey, currentSource === 'manual' ? 'first' : currentSource);
        }

        setSelectedSources(prev => ({
            ...prev,
            [fieldKey]: source
        }));
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

        const districtId = normalizeString(church.DistrictId);
        if (districtId && address.state) {
            const district = DISTRICTS.find(item => item.id === districtId);
            if (district && !district.states.includes(address.state)) {
                errors.push('District must match the selected state.');
            }
        }

        return errors;
    };

    const buildResolvedMerge = (
        nextSurvivor: CandidateSource = survivorSource,
        sourceSelections: Record<string, MergeSource> = selectedSources,
        overrides: Record<string, string> = manualOverrides,
        manualChurchSelection: Church | null | undefined = manualChurch
    ) => {
        const sourceFor = (fieldKey: string): MergeSource => resolvedSourceFor(fieldKey, nextSurvivor, sourceSelections);
        const getStateOverride = (key: string): string | undefined => (
            hasOwnValue(overrides, key) ? overrides[key] : undefined
        );

        if (isPeopleMerge && firstPerson && secondPerson) {
            const survivor = nextSurvivor === 'first' ? firstPerson : secondPerson;
            const losingId = nextSurvivor === 'first' ? secondPerson.Id : firstPerson.Id;
            const resolved: Person = { ...survivor };

            const firstNameSource = sourceFor('firstName');
            resolved.FirstName = firstNameSource === 'manual'
                ? (getStateOverride('firstName') ?? '')
                : resolveBySource(firstPerson.FirstName, secondPerson.FirstName, firstNameSource);

            const lastNameSource = sourceFor('lastName');
            resolved.LastName = lastNameSource === 'manual'
                ? (getStateOverride('lastName') ?? '')
                : resolveBySource(firstPerson.LastName, secondPerson.LastName, lastNameSource);

            const emailSource = sourceFor('email');
            resolved.Email = emailSource === 'manual'
                ? DataTypeHelpers.trimToNull(getStateOverride('email') ?? '')
                : resolveBySource(firstPerson.Email, secondPerson.Email, emailSource);

            const dateOfBirthSource = sourceFor('dateOfBirth');
            resolved.DateOfBirth = dateOfBirthSource === 'manual'
                ? DataTypeHelpers.trimToNull(getStateOverride('dateOfBirth') ?? '')
                : resolveBySource(firstPerson.DateOfBirth, secondPerson.DateOfBirth, dateOfBirthSource);

            const phoneSource = sourceFor('phoneNumber');
            resolved.PhoneNumber = phoneSource === 'manual'
                ? DataTypeHelpers.trimToNull(getStateOverride('phoneNumber') ?? '')
                : resolveBySource(firstPerson.PhoneNumber, secondPerson.PhoneNumber, phoneSource);

            const churchSource = sourceFor('currentChurch');
            resolved.CurrentChurch = churchSource === 'manual'
                ? (manualChurchSelection ?? null)
                : (churchSource === 'first' ? firstPerson.CurrentChurch : secondPerson.CurrentChurch);
            resolved.CurrentChurchId = resolved.CurrentChurch?.Id ?? null;

            const addressSource = sourceFor('address');
            if (addressSource === 'manual') {
                const street = getStateOverride('addressStreet') ?? '';
                const city = getStateOverride('addressCity') ?? '';
                const state = getStateOverride('addressState') ?? '';
                const zipText = getStateOverride('addressZip') ?? '';
                const parsedZip = parseInt(zipText.replace(/\D/g, ''), 10);
                if (!street && !city && !state && !zipText) {
                    resolved.PhysicalAddress = null;
                } else {
                    resolved.PhysicalAddress = {
                        StreetAddress: street,
                        City: city,
                        State: state,
                        ZipCode: Number.isNaN(parsedZip) ? null : parsedZip
                    };
                }
            } else {
                const sourceAddress = addressSource === 'first' ? firstPerson.PhysicalAddress : secondPerson.PhysicalAddress;
                resolved.PhysicalAddress = sourceAddress ? { ...sourceAddress } : null;
            }

            return {
                type: 'people' as const,
                resolved,
                losingId,
                errors: validatePerson(resolved)
            };
        }

        if (!isPeopleMerge && firstChurch && secondChurch) {
            const survivor = nextSurvivor === 'first' ? firstChurch : secondChurch;
            const losingId = nextSurvivor === 'first' ? secondChurch.Id : firstChurch.Id;
            const resolved: Church = { ...survivor };

            const nameSource = sourceFor('name');
            resolved.Name = nameSource === 'manual'
                ? (getStateOverride('name') ?? '')
                : resolveBySource(firstChurch.Name, secondChurch.Name, nameSource);

            const districtSource = sourceFor('districtId');
            resolved.DistrictId = districtSource === 'manual'
                ? (getStateOverride('districtId') ?? '')
                : resolveBySource(firstChurch.DistrictId, secondChurch.DistrictId, districtSource);

            const addressSource = sourceFor('address');
            if (addressSource === 'manual') {
                const street = getStateOverride('addressStreet') ?? '';
                const city = getStateOverride('addressCity') ?? '';
                const state = getStateOverride('addressState') ?? '';
                const zipText = getStateOverride('addressZip') ?? '';
                const parsedZip = parseInt(zipText.replace(/\D/g, ''), 10);
                resolved.PhysicalAddress = {
                    StreetAddress: street,
                    City: city,
                    State: state,
                    ZipCode: Number.isNaN(parsedZip) ? null : parsedZip
                };
            } else {
                const sourceAddress = addressSource === 'first' ? firstChurch.PhysicalAddress : secondChurch.PhysicalAddress;
                resolved.PhysicalAddress = sourceAddress ? { ...sourceAddress } : ({
                    StreetAddress: '',
                    City: '',
                    State: '',
                    ZipCode: null
                });
            }

            return {
                type: 'church' as const,
                resolved,
                losingId,
                errors: validateChurch(resolved)
            };
        }

        return null;
    };

    const toComparableMerge = (mergeData: ReturnType<typeof buildResolvedMerge>) => {
        if (!mergeData) return null;

        if (mergeData.type === 'people') {
            return {
                type: mergeData.type,
                losingId: mergeData.losingId ?? null,
                survivorId: mergeData.resolved.Id ?? null,
                firstName: normalizeString(mergeData.resolved.FirstName),
                lastName: normalizeString(mergeData.resolved.LastName),
                email: normalizeString(mergeData.resolved.Email),
                dateOfBirth: normalizeString(mergeData.resolved.DateOfBirth),
                phoneNumber: normalizeString(mergeData.resolved.PhoneNumber),
                currentChurchId: normalizeString(mergeData.resolved.CurrentChurchId),
                address: normalizeComparableAddress(mergeData.resolved.PhysicalAddress)
            };
        }

        return {
            type: mergeData.type,
            losingId: mergeData.losingId ?? null,
            survivorId: mergeData.resolved.Id ?? null,
            name: normalizeString(mergeData.resolved.Name),
            districtId: normalizeString(mergeData.resolved.DistrictId),
            address: normalizeComparableAddress(mergeData.resolved.PhysicalAddress)
        };
    };

    const defaultMergeData = useMemo(
        () => buildResolvedMerge(survivorSource, getDefaultSelections(survivorSource), {}, undefined),
        [survivorSource, defaultFieldDefinitions, firstPerson, secondPerson, firstChurch, secondChurch]
    );

    const currentMergeData = useMemo(
        () => buildResolvedMerge(),
        [survivorSource, selectedSources, manualOverrides, manualChurch, defaultFieldDefinitions, firstPerson, secondPerson, firstChurch, secondChurch]
    );

    const isReviewDirty = useMemo(
        () => JSON.stringify(toComparableMerge(currentMergeData)) !== JSON.stringify(toComparableMerge(defaultMergeData)),
        [currentMergeData, defaultMergeData]
    );

    const resolvedChurchAddressState = useMemo(() => {
        if (isPeopleMerge || currentMergeData?.type !== 'church') {
            return null;
        }

        return normalizeString(currentMergeData.resolved.PhysicalAddress?.State);
    }, [currentMergeData, isPeopleMerge]);

    const availableManualDistricts = useMemo(() => {
        if (isPeopleMerge || !resolvedChurchAddressState) {
            return DISTRICTS;
        }

        return DISTRICTS_BY_STATE[resolvedChurchAddressState] ?? [];
    }, [isPeopleMerge, resolvedChurchAddressState]);

    const mergeSummary = {
        survivor: survivorSource === 'first' ? formatItemDisplay(firstItem) : formatItemDisplay(secondItem),
        merged: survivorSource === 'first' ? formatItemDisplay(secondItem) : formatItemDisplay(firstItem)
    };

    const closeReview = () => {
        setShowDiscardConfirmation(false);
        setIsReviewing(false);
        setValidationErrors([]);
        setShowAllFields(false);
    };

    const requestReviewClose = () => {
        if (isMerging) return;
        if (isReviewDirty) {
            setShowDiscardConfirmation(true);
            return;
        }

        closeReview();
    };

    useEffect(() => {
        if (!isReviewing || isMerging || showDiscardConfirmation) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            requestReviewClose();
        };

        document.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [isReviewing, isMerging, showDiscardConfirmation, isReviewDirty]);

    const handleContinueToConfirmation = () => {
        const mergeData = currentMergeData;
        if (!mergeData) return;

        if (mergeData.errors.length > 0) {
            setValidationErrors(mergeData.errors);
            return;
        }

        setValidationErrors([]);
        setIsConfirming(true);
    };

    const handleMerge = async () => {
        const mergeData = currentMergeData;
        if (!mergeData) return;
        if (mergeData.errors.length > 0) {
            setValidationErrors(mergeData.errors);
            setIsConfirming(false);
            return;
        }

        setIsMerging(true);
        setError(undefined);
        try {
            if (mergeData.type === 'people') {
                await PeopleService.update(auth, mergeData.resolved, mergeData.losingId);
            } else {
                await ChurchesService.update(auth, mergeData.resolved, mergeData.losingId);
            }

            sharedGlobalStatusToast.set({
                type: 'success',
                title: 'Merge Complete',
                icon: 'fas faCircleCheck',
                message: formatSuccessMessage(mergeType, mergeData.resolved),
                timeout: 10000
            });

            setIsConfirming(false);
            closeReview();
            setValidationErrors([]);
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
            <div ref={panelRef} className="card bg-base-200 shadow-md">
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
                            <div dangerouslySetInnerHTML={{ __html: error }} />
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
                    onClick={event => {
                        if (event.target === event.currentTarget) {
                            requestReviewClose();
                        }
                    }}
                    onClose={() => {
                        if (isReviewing) {
                            setIsReviewing(false);
                        }
                        setValidationErrors([]);
                    }}
                >
                    <div className="modal-box w-11/12 max-w-5xl">
                        <h3 className="font-bold text-lg">
                            Merge Review: {mergeType === 'people' ? 'People' : 'Churches'}
                        </h3>

                        {(error || validationErrors.length > 0) && (
                            <div role="alert" className="alert alert-error mt-4">
                                <FontAwesomeIcon icon="fas faCircleExclamation" />
                                <div>
                                    {error && <div dangerouslySetInnerHTML={{ __html: error }} />}
                                    {validationErrors.map(validationError => (
                                        <div key={validationError}>{validationError}</div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isMerging && (
                            <div role="status" className="alert alert-info mt-4">
                                <span className="loading loading-spinner loading-sm"></span>
                                <span>Merging {mergeType === 'people' ? 'People' : 'Churches'}...</span>
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
                                const manualValue = getOverride(field.key) ?? '';
                                return (
                                    <div key={field.key} className="border border-base-300 rounded-lg p-3">
                                        <div className="font-semibold mb-2">{field.label}</div>
                                        <div className="join w-full mt-0 mb-0" role="radiogroup" aria-label={field.label}>
                                            <button
                                                type="button"
                                                role="radio"
                                                aria-checked={selectedSource === 'first'}
                                                className={`join-item btn flex-1 h-auto min-h-0 py-2 px-3 ${selectedSource === 'first' ? 'btn-primary' : 'btn-outline'}`}
                                                onClick={() => updateSelectedSource(field.key, 'first')}
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
                                                onClick={() => updateSelectedSource(field.key, 'second')}
                                            >
                                                <div className="w-full text-left">
                                                    <span className="badge badge-sm mb-1">Second</span>
                                                    <div className="whitespace-normal break-words">{field.secondDisplay}</div>
                                                </div>
                                            </button>
                                            <button
                                                type="button"
                                                role="radio"
                                                aria-checked={selectedSource === 'manual'}
                                                className={`join-item btn flex-1 h-auto min-h-0 py-2 px-3 ${selectedSource === 'manual' ? 'btn-primary' : 'btn-outline'}`}
                                                onClick={() => updateSelectedSource(field.key, 'manual')}
                                            >
                                                <div className="w-full text-left">
                                                    <span className="badge badge-sm mb-1">Manual</span>
                                                    <div className="whitespace-normal break-words">Enter a custom value</div>
                                                </div>
                                            </button>
                                        </div>

                                        {selectedSource === 'manual' && ['firstName', 'lastName', 'email', 'phoneNumber', 'name'].includes(field.key) && (
                                            <div className="mt-3">
                                                <label className="label mt-0 mb-0">
                                                    <span className="label-text text-xs">Manual Entry</span>
                                                </label>
                                                <input
                                                    type={field.key === 'email' ? 'email' : 'text'}
                                                    className="input input-bordered input-sm w-full"
                                                    value={manualValue}
                                                    onChange={event => updateOverride(field.key, event.target.value)}
                                                    placeholder="Enter a custom value"
                                                />
                                            </div>
                                        )}

                                        {selectedSource === 'manual' && field.key === 'districtId' && (
                                            <div className="mt-3">
                                                <label className="label mt-0 mb-0">
                                                    <span className="label-text text-xs">Manual Entry</span>
                                                </label>
                                                <select
                                                    className="select select-bordered select-sm w-full"
                                                    value={getOverride('districtId') ?? ''}
                                                    onChange={event => updateOverride('districtId', event.target.value)}
                                                >
                                                    <option value="">Select District</option>
                                                    {availableManualDistricts.map(district => (
                                                        <option key={district.id} value={district.id}>
                                                            {district.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {selectedSource === 'manual' && field.key === 'dateOfBirth' && (
                                            <div className="mt-3">
                                                <label className="label mt-0 mb-0">
                                                    <span className="label-text text-xs">Manual Entry</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    className="input input-bordered input-sm w-full"
                                                    value={manualValue}
                                                    onChange={event => updateOverride(field.key, event.target.value)}
                                                />
                                            </div>
                                        )}

                                        {selectedSource === 'manual' && field.key === 'currentChurch' && (
                                            <div className="mt-3">
                                                <label className="label mt-0 mb-0">
                                                    <span className="label-text text-xs">Manual Entry</span>
                                                </label>
                                                {manualChurch ? (
                                                    <div className="flex items-center gap-2 mt-0">
                                                        <span className="input input-bordered input-sm flex-1 flex items-center text-sm">
                                                            {formatChurchValue(manualChurch)}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="btn btn-ghost btn-sm"
                                                            title="Clear church"
                                                            onClick={() => {
                                                                clearValidationErrors();
                                                                setManualChurch(null);
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon="fas faXmark" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <ChurchLookup
                                                        showTips={ChurchSearchTips.None}
                                                        required={true}
                                                        onSelect={(_, churchInfo) => {
                                                            clearValidationErrors();
                                                            setManualChurch(churchInfo);
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        )}

                                        {selectedSource === 'manual' && field.key === 'address' && (
                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-sm"
                                                    value={getOverride('addressStreet') ?? ''}
                                                    onChange={event => updateOverride('addressStreet', event.target.value)}
                                                    placeholder="Street override"
                                                />
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-sm"
                                                    value={getOverride('addressCity') ?? ''}
                                                    onChange={event => updateOverride('addressCity', event.target.value)}
                                                    placeholder="City override"
                                                />
                                                <select
                                                    className="select select-bordered select-sm"
                                                    value={getOverride('addressState') ?? ''}
                                                    onChange={event => updateAddressStateOverride(event.target.value)}
                                                >
                                                    <option value="">State</option>
                                                    {(isPeopleMerge ? PERSON_ADDRESS_STATES : CHURCH_ADDRESS_STATES).map(state => (
                                                        <option key={state} value={state}>{state}</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-sm"
                                                    value={getOverride('addressZip') ?? ''}
                                                    onChange={event => updateOverride('addressZip', event.target.value)}
                                                    placeholder="Zip"
                                                    minLength={5}
                                                    maxLength={5}
                                                    pattern="[0-9]{5}"
                                                />
                                            </div>
                                        )}
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
                                onClick={requestReviewClose}
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
                    yesLabel={isMerging ? `Merging ${mergeType === 'people' ? 'People' : 'Churches'}...` : 'Merge'}
                    onYes={handleMerge}
                    noLabel="Cancel"
                    onNo={() => setIsConfirming(false)}
                >
                    {isMerging && (
                        <div role="status" className="alert alert-info mt-2 mb-3">
                            <span className="loading loading-spinner loading-sm"></span>
                            <span>Merging {mergeType === 'people' ? 'People' : 'Churches'}...</span>
                        </div>
                    )}
                    <p className="font-bold mb-2">
                        ⚠️ This action CANNOT be undone. Any changes made as part of merging cannot be reversed.
                    </p>
                    <p className="mb-4">
                        <strong>{mergeSummary.survivor}</strong> will keep all records and <strong>{mergeSummary.merged}</strong> will be merged into it.
                    </p>
                    <p>Are you sure you want to continue?</p>
                </ConfirmationDialog>
            )}

            {showDiscardConfirmation && (
                <ConfirmationDialog
                    title="Discard Merge Changes?"
                    yesLabel="Discard"
                    noLabel="Keep Editing"
                    onYes={closeReview}
                    onNo={() => setShowDiscardConfirmation(false)}
                    className="w-full max-w-md"
                >
                    <p>You have unsaved merge-review changes. Discard them and close this dialog?</p>
                </ConfirmationDialog>
            )}
        </>
    );
}
