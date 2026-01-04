import { useEffect, useRef, useState } from "react";
import { AuthManager } from 'types/AuthManager';
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { DatabaseSettings, DatabaseSettingsMeet, DatabasesService } from "types/services/DatabasesService";
import type { ReportMeetFilter } from "types/services/DatabaseReportsService";

interface Props {
    onSelect: (result: DatabaseAndMeetLookupResult[] | null) => void;
    eventId: string;
    excludeIds: DatabaseAndMeetLookupResult[] | null;
    isDisabled: boolean;
}

/**
 * Result of the lookup dialog.
 */
export type DatabaseAndMeetLookupResult = {

    /**
     * Id for the database.
     */
    databaseId: string,

    /**
     * Id for the meet.
     */
    meetId: number,

    /**
     * Name of the meet.
     */
    name: string
};

export default function EventDatabaseLookupDialog({
    eventId,
    excludeIds,
    onSelect,
    isDisabled }: Props) {

    const dialogRef = useRef<HTMLDialogElement>(null);

    const auth = AuthManager.useNanoStore();

    const [allDatabases, setAllDatabases] = useState<DatabaseSettings[] | undefined>();
    const [currentDatabase, setCurrentDatabase] = useState<DatabaseSettings | undefined>();
    const [selectedResults, setSelectedResults] = useState<DatabaseAndMeetLookupResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [loadingOrSavingError, setLoadingOrSavingError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);

        if (!isLoading && !isAssigning) {

            DatabasesService.getAllDatabaseSettingsForEvent(
                auth,
                eventId,
                true)
                .then(databases => {
                    const filteredDatabases = excludeIds ? [] : databases;
                    if (excludeIds) {
                        const excludeIdSet = new Set<string>(
                            excludeIds.map(d => `${d.databaseId}_${d.meetId}`));
                        for (const database of databases) {
                            const filteredMeets: DatabaseSettingsMeet[] = [];
                            for (const filter of database.Meets) {
                                if (!excludeIdSet.has(`${database.DatabaseId}_${filter.Id}`)) {
                                    filteredMeets.push(filter);
                                }
                            }

                            (database as any).Meets = filteredMeets;

                            if (database.Meets.length > 0) {
                                filteredDatabases.push(database);
                            }
                        }
                    }

                    setAllDatabases(filteredDatabases);

                    setIsLoading(false);
                    setLoadingOrSavingError(null);
                })
                .catch(err => {
                    setIsLoading(false);
                    setLoadingOrSavingError(err.message ?? "Unknown error");
                });
        }
    }, [eventId]);

    const selectedCountByDatabase = isLoading || isAssigning || currentDatabase
        ? undefined
        : selectedResults.reduce<Record<string, number>>((acc, result) => {
            acc[result.databaseId] = (acc[result.databaseId] || 0) + 1;
            return acc;
        }, {});

    const selectedMeetIds = isLoading || isAssigning || !currentDatabase
        ? undefined
        : new Set<number>(selectedResults
            .filter(d => d.databaseId === currentDatabase!.DatabaseId)
            .map(d => d.meetId));

    return (
        <dialog ref={dialogRef} className="modal" open>
            <div className="modal-box w-full max-w-3xl">
                <h3 className="font-bold text-lg">Select a {currentDatabase ? "Division" : "Database"}</h3>
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
                </div>
                {(isLoading || isAssigning) && (
                    <div className="flex justify-center items-center">
                        <span className="loading loading-spinner loading-xl"></span>&nbsp;
                        {isLoading
                            ? `Loading ${currentDatabase ? "divisions" : "databases"} ...`
                            : `Selecting ${currentDatabase ? "divisions" : "database"} ...`}
                    </div>)}
                {(!isLoading && !isAssigning) && (
                    <div className="mt-4">
                        {!currentDatabase && allDatabases && allDatabases.length > 0 && (
                            <div className="flex flex-wrap gap-4">
                                {allDatabases.map(database => {
                                    const count = selectedCountByDatabase![database.DatabaseId] ?? 0;
                                    return (
                                        <button
                                            key={`database - card - ${database.DatabaseId}`}
                                            type="button"
                                            className="card live-events-card w-85 card-sm shadow-sm border-2 border-solid mt-0 relative"
                                            onClick={() => setCurrentDatabase(database)}
                                            disabled={isDisabled}>
                                            <div className="card-body p-2">
                                                <div className="flex items-start gap-4">
                                                    <div className="flex-1 pr-6 mt-0">
                                                        <h2 className="card-title mb-0 mt-2">
                                                            {database.DatabaseName}
                                                        </h2>
                                                        {count > 0 && (
                                                            <div className="badge badge-secondary badge-sm mt-0 mb-0">
                                                                {count} Selected
                                                            </div>)}
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
                        {currentDatabase && (
                            <div className="flex flex-wrap gap-4">
                                {currentDatabase.Meets.map(meet => {
                                    const isSelected = selectedMeetIds!.has(meet.Id);
                                    return (
                                        <button
                                            key={`database - card - ${currentDatabase.DatabaseId} - meets - ${meet.Id}`}
                                            type="button"
                                            className="card live-events-card w-85 card-sm shadow-sm border-2 border-solid mt-0 relative"
                                            onClick={() => {
                                                const newSelections = isSelected
                                                    ? selectedResults.filter(d => d.databaseId !== currentDatabase.DatabaseId || d.meetId !== meet.Id)
                                                    : [
                                                        ...selectedResults,
                                                        {
                                                            databaseId: currentDatabase.DatabaseId,
                                                            meetId: meet.Id,
                                                            name: meet.Name
                                                        } as DatabaseAndMeetLookupResult
                                                    ];
                                                setSelectedResults(newSelections);
                                            }}
                                            disabled={isDisabled}>
                                            <div className="card-body p-2">
                                                <div className="flex items-start gap-4">
                                                    <div className="flex-1 pr-6 mt-0">
                                                        <h2 className="card-title mb-0 mt-2">
                                                            {meet.NameOverride ?? meet.Name}
                                                        </h2>
                                                    </div>
                                                </div>
                                                <FontAwesomeIcon
                                                    icon={isSelected ? `far faSquareCheck` : `far faSquare`}
                                                    classNames={["icon text-lg rtl:flip absolute top-4 right-4"]}
                                                />
                                            </div>
                                        </button>);
                                })}
                            </div>)}
                        {!allDatabases || allDatabases.length === 0 && (
                            <div role="alert" className="alert alert-info alert-outline">
                                <FontAwesomeIcon icon="far faLightbulb" />
                                <span className="text-base-content">
                                    You have already selected all available databases from this event.
                                </span>
                            </div>)}
                    </div>)}
                <div className="flex flex-wrap gap-2 mt-4 justify-end">
                    {currentDatabase && (
                        <button
                            className="btn btn-sm btn-success mt-0"
                            type="button"
                            disabled={isLoading || isAssigning}
                            tabIndex={1}
                            onClick={() => setCurrentDatabase(undefined)}>
                            <FontAwesomeIcon icon="fas faArrowLeft" />&nbsp;Back to Databases
                        </button>)}
                    <button
                        className="btn btn-sm btn-success mt-0"
                        type="button"
                        disabled={isLoading || isAssigning || selectedResults.length === 0}
                        tabIndex={2}
                        onClick={() => {
                            setIsAssigning(true);
                            onSelect(selectedResults);
                            dialogRef.current?.close();
                        }}>
                        Select {selectedResults.length} Division{selectedResults.length !== 1 ? "s" : ""}
                    </button>
                    <button
                        className="btn btn-sm btn-warning mt-0"
                        type="button"
                        disabled={isLoading || isAssigning}
                        tabIndex={3}
                        onClick={() => {
                            setIsAssigning(true);
                            onSelect(null);
                            dialogRef.current?.close();
                        }}>
                        Cancel
                    </button>
                </div>
            </div>
        </dialog >);
}