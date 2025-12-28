import { useEffect, useRef, useState } from "react";
import { AuthManager } from 'types/AuthManager';
import { EventFilter, EventInfo, EventsService } from "types/services/EventsService";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import PaginationControl from "./PaginationControl";

interface Props {

    /**
     * Handler for selecting an event.
     * 
     * @param event Selected event or null (if canceled).
     */
    onSelect: (event: EventInfo | null) => void;

    /**
     * Id for the competition type.
     */
    typeId: string;

    /**
     * Season for the events to include.
     */
    season: number;

    /**
     * Optional exclusion for a specific event.
     */
    excludeEventId?: string;

    /**
     * Optional region id for any events.
     */
    regionId?: string;

    /**
     * Optional district id for any events.
     */
    districtId?: string;

    /**
     * Optional value indicating just the district events should be included.
     */
    includeDistrict?: boolean;

    /**
     * Optional value indicating just the region events should be included.
     */
    includeRegion?: boolean;

    /**
     * Optional value indicating just the national events should be included.
     */
    includeNation?: boolean;

    /**
     * Optional value indicating the event must have databases.
     */
    requireDatabases?: boolean;
}

export default function EventLookupDialog({
    onSelect,
    typeId,
    season,
    excludeEventId,
    regionId,
    districtId,
    includeDistrict = true,
    includeRegion = true,
    includeNation = true,
    requireDatabases = false }: Props) {

    const dialogRef = useRef<HTMLDialogElement>(null);

    const auth = AuthManager.useNanoStore();

    const [intermediateSearchText, setIntermediateSearchText] = useState<string | undefined>(undefined);
    const [searchText, setSearchText] = useState<string | undefined>(undefined);
    const [events, setEvents] = useState<EventInfo[] | undefined>(undefined);
    const [currentPageNumber, setCurrentPageNumber] = useState<number | undefined>(0);
    const [pageCount, setPageCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [loadingOrSavingError, setLoadingOrSavingError] = useState<string | null>(null);

    useEffect(() => {
        const newPageNumber = currentPageNumber ?? 0;
        setIsLoading(true);

        if (!isLoading && !isAssigning) {
            EventsService.getEvents(
                auth,
                6,
                newPageNumber,
                typeId,
                null, // Church ID
                regionId ?? null,
                districtId ?? null,
                EventFilter.MyDistrictRegionNation,
                searchText ?? "",
                requireDatabases,
                false, // Include Only Scores
                includeDistrict,
                includeRegion,
                includeNation,
                null, // Include all time periods.
                true, // Include only what the user is authorized to view.
                season,
                excludeEventId ?? null)
                .then(page => {
                    setIsLoading(false);
                    setLoadingOrSavingError(null);
                    setEvents(page[0].events);
                    setPageCount(page[0].pageCount);
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
                <h3 className="font-bold text-lg">Select an Event</h3>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={() => {
                        onSelect(null);
                        dialogRef.current?.close();
                    }}
                >✕</button>
                <div className="mt-4">
                    {loadingOrSavingError && (
                        <div role="alert" className="alert alert-error mt-2 mb-2 w-full">
                            <FontAwesomeIcon icon="fas faCircleExclamation" />
                            <div>
                                <b>Error: </b> {loadingOrSavingError}
                            </div>
                        </div>)}
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
                        {isLoading ? "Loading events ..." : "Selecting event ..."}
                    </div>)}
                {(!isLoading && !isAssigning) && (
                    <>
                        <div className="mt-4">
                            {events && events.length > 0 && (
                                <div className="flex flex-wrap gap-4">
                                    {events.map(event => {

                                        let locationLabel: string | null = null;
                                        if (event.LocationName || event.Location) {
                                            if (event.LocationName && event.Location) {
                                                locationLabel = `${event.LocationName}, ${event.Location.City}, ${event.Location.State}`;
                                            }
                                            else if (event.LocationName) {
                                                locationLabel = event.LocationName;
                                            }
                                            else {
                                                locationLabel = `${event.Location.City}, ${event.Location.State}`;
                                            }
                                        }

                                        const typeId = event.TypeId.substring(2).toLowerCase();

                                        return (
                                            <button
                                                type="button"
                                                className="card live-events-card w-85 card-sm shadow-sm border-2 border-solid mt-0 relative"
                                                onClick={() => onSelect(event)}>
                                                <div className="card-body p-2 pl-4">
                                                    <div className="flex items-start gap-4">
                                                        <img
                                                            src={`/assets/logos/${typeId}/${typeId}-logo.png`}
                                                            alt={`${typeId.toUpperCase()} Logo`}
                                                            className="w-20 h-20 flex-shrink-0 mt-2"
                                                        />
                                                        <div className="flex-1 pr-6 mt-2">
                                                            <h2 className="card-title mb-0 mt-1">
                                                                {event.Name}
                                                            </h2>
                                                            <p className="mt-0">{event.StartDate} - {event.EndDate}</p>
                                                            {locationLabel && <p className="text-gray-500 italic m-0">{locationLabel}</p>}
                                                        </div>
                                                    </div>
                                                    <FontAwesomeIcon
                                                        icon="fas faArrowRight"
                                                        classNames={["icon text-lg rtl:flip absolute top-4 right-4"]}
                                                    />
                                                </div>
                                            </button>);
                                    })}
                                </div>)}
                            {!events || events.length === 0 && (
                                <div role="alert" className="alert alert-info alert-outline">
                                    <FontAwesomeIcon icon="far faLightbulb" />
                                    <span className="text-base-content">
                                        No events match your search criteria.
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
                            setIsAssigning(true);
                            onSelect(null);
                            dialogRef.current?.close();
                        }}>
                        Close
                    </button>
                </div>
            </div>
        </dialog>);
}