import { useEffect, useRef, useState } from "react";
import { Church } from 'types/services/ChurchesService';
import FontAwesomeIcon from './FontAwesomeIcon';
import { AuthManager } from 'types/AuthManager';
import { PeopleService, Person, PersonParentType } from "types/services/PeopleService";
import { RequiredPersonFields } from "types/services/EventsService";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import PersonCard from "./PersonCard";
import PaginationControl from "./apps/event/PaginationControl";

interface Props {

    /**
     * Title for the dialog.
     */
    title: string,

    /**
     * Description for the dialog.
     */
    description: string,

    /**
     * Selection handler when a person is selected.
     * 
     * @param person Selected person. If this is null, it indicates the selection was cancelled.
     */
    onSelect: (person: Person | null) => void,

    /**
     * Type of the parent entity.
     */
    parentType?: PersonParentType;

    /**
     * Id for the parent entity.
     */
    parentId?: string;

    /**
     * Optional Id to use when looking up people for an event in order to infer permissions.
     */
    eventId?: string;

    /**
     * List of ids for people that shouldn't be returned.
     */
    excludeIds?: Set<string>;

    /**
     * Indicates a permission scope that should be excluded.
     */
    excludeWithScope?: boolean;

    /**
     * Indicates whether the parent can be changed.
     */
    allowParentChange?: boolean;

    /**
     * Region ID to use when filtering new parent selection.
     */
    newParentRegionId?: string;

    /**
     * District ID to use when filtering new parent selection.
     */
    newParentDistrictId?: string;

    /**
     * Label for the new entity. If this is null, it is assumed that a new object cannot be added.
     */
    newEntityLabel?: string;

    /**
     * Parent being used for selection.
     */
    currentParent?: Church;

    /**
     * Exclude the people who don't have an e-mail address.
     */
    excludePeopleWithoutEmail?: boolean;

    /**
     * List of additional required fields for people.
     */
    requiredFields?: RequiredPersonFields;

    /**
     * Hides optional fields on the person page.
     */
    hideOptionalFieldsOnPersonPage?: boolean;

    /**
     * Value indicating whether only users should be included.
     */
    includeOnlyUsers?: boolean;

    /*
     * Value indicating whether users from all regions and districts should be included.
     */
    includeAllUsers?: boolean;
}

export default function PersonLookupDialog({
    title,
    description,
    onSelect,
    eventId,
    excludeIds,
    excludeWithScope = false,
    parentType = PersonParentType.Organization,
    parentId,
    excludePeopleWithoutEmail = false,
    includeOnlyUsers = false,
    includeAllUsers = false }: Props) {

    const dialogRef = useRef<HTMLDialogElement>(null);

    const auth = AuthManager.useNanoStore();

    const [intermediateSearchText, setIntermediateSearchText] = useState<string | undefined>(undefined);
    const [searchText, setSearchText] = useState<string | undefined>(undefined);
    const [people, setPeople] = useState<Person[] | undefined>(undefined);
    const [currentPageNumber, setCurrentPageNumber] = useState<number | undefined>(0);
    const [pageCount, setPageCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [loadingOrSavingError, setLoadingOrSavingError] = useState<string | null>(null);

    useEffect(() => {
        const newPageNumber = currentPageNumber ?? 0;
        setIsLoading(true);

        if (!isLoading && !isAssigning) {
            PeopleService.getPeople(
                auth,
                15,
                newPageNumber,
                parentType,
                parentId ?? null,
                searchText,
                excludeWithScope,
                true, // TODO: Add church support
                false, // Include people regardless of whether they are approved.
                false, // Indicates only potential duplicates should be listed.
                includeOnlyUsers,
                excludePeopleWithoutEmail,
                eventId ?? null,
                includeAllUsers)
                .then(page => {
                    setPeople(page.Items);
                    setPageCount(page.PageCount ?? 0);
                    setCurrentPageNumber(newPageNumber);

                    setIsLoading(false);
                    setLoadingOrSavingError(null);
                })
                .catch(err => {
                    setIsLoading(false);
                    setLoadingOrSavingError(err.message ?? "Unknown error");
                });
        }
    }, [searchText, currentPageNumber]);

    return (
        <dialog ref={dialogRef} className="modal" open>
            <div className="modal-box w-full max-w-3xl">
                <h3 className="font-bold text-lg">{title}</h3>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={() => {
                        onSelect(null);
                        dialogRef.current?.close();
                    }}
                >✕</button>
                <div className="mt-0">
                    {loadingOrSavingError && (
                        <div role="alert" className="alert alert-error mt-2 mb-2 w-full">
                            <FontAwesomeIcon icon="fas faCircleExclamation" />
                            <div>
                                <b>Error: </b> {loadingOrSavingError}
                            </div>
                        </div>)}
                    <p className="mt-0">{description}</p>
                    <div className="w-full">
                        <label className="input input-sm mt-0 w-full">
                            <FontAwesomeIcon icon="fas faSearch" classNames={["h-[1em]", "opacity-50"]} />
                            <input
                                type="text"
                                className="grow"
                                placeholder="Name"
                                value={intermediateSearchText ?? ""}
                                onChange={e => {
                                    const currentValue = e.target.value;
                                    const newText = DataTypeHelpers.isNullOrEmpty(currentValue)
                                        ? undefined
                                        : currentValue;
                                    setIntermediateSearchText(newText);
                                }}
                                onBlur={() => setSearchText(intermediateSearchText)}
                                onKeyDown={e => {
                                    if (e.key === "Enter") {
                                        setSearchText(intermediateSearchText);
                                    }
                                }}
                                disabled={isLoading || isAssigning} />
                            {(intermediateSearchText?.length ?? 0) > 0 && (
                                <button
                                    className="btn btn-ghost btn-xs"
                                    onClick={() => {
                                        setSearchText(undefined);
                                        setIntermediateSearchText(undefined);
                                    }}>
                                    <FontAwesomeIcon icon="fas faCircleXmark" />
                                </button>)}
                        </label>
                    </div>
                </div>
                {(isLoading || isAssigning) && (
                    <div className="flex justify-center items-center">
                        <span className="loading loading-spinner loading-xl"></span>&nbsp;
                        {isLoading ? "Loading people ..." : "Selecting person ..."}
                    </div>)}
                {(!isLoading && !isAssigning) && (
                    <>
                        <div className="mt-4">
                            {people && people.length > 0 && (
                                <div className="flex flex-wrap gap-4">
                                    {people.map(person => {
                                        return (
                                            <PersonCard
                                                key={`person_${person.Id}`}
                                                person={person}
                                                onSelect={p => {
                                                    setIsAssigning(true);
                                                    onSelect(p);
                                                }}
                                                isDisabled={excludeIds && excludeIds.has(person.Id!)} />);
                                    })}
                                </div>)}
                            {!people || people.length === 0 && (
                                <div role="alert" className="alert alert-info alert-outline">
                                    <FontAwesomeIcon icon="far faLightbulb" />
                                    <span className="text-base-content">
                                        No people match your search criteria.
                                    </span>
                                </div>)}
                        </div>
                        <PaginationControl
                            currentPage={currentPageNumber ?? 0}
                            pages={pageCount ?? 0}
                            setPage={setCurrentPageNumber}
                            isLoading={isLoading || isAssigning} />
                    </>)}
                <div className="mt-4 text-right">
                    <button
                        className="btn btn-warning mt-0"
                        type="button"
                        disabled={isLoading || isAssigning}
                        tabIndex={2}
                        onClick={() => {
                            onSelect(null);
                            dialogRef.current?.close();
                        }}>
                        Close
                    </button>
                </div>
            </div>
        </dialog>);
}