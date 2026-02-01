import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useState } from "react";
import EventLookupDialog from "../EventLookupDialog";
import EventDatabaseLookupDialog from "../EventDatabaseLookupDialog";
import { OnlineDatabaseSummary } from "types/services/AstroDatabasesService";

interface Props {
    regionId: string | null;
    districtId: string | null;
    eventType: string;
    season: number;
    onSelectDatabase: (eventId: string, summary: OnlineDatabaseSummary) => void;
    isDisabled: boolean;
}

export default function DatabaseSelector({
    regionId,
    districtId,
    eventType,
    season,
    onSelectDatabase,
    isDisabled }: Props) {

    const [originalSelection, setOriginalSelection] = useState<{
        eventId: string;
        eventName: string;
        database: OnlineDatabaseSummary;
    } | undefined>();

    const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
    const [selectedEventName, setSelectedEventName] = useState<string | undefined>();
    const [selectedDatabase, setSelectedDatabase] = useState<OnlineDatabaseSummary | undefined>();

    const [isSelecting, setIsSelecting] = useState(false);

    return (
        <>
            <div className="w-full mb-0">
                {!selectedEventName && !selectedDatabase && (
                    <span className="mt-0 mb-0 italic">
                        No Database Selected for Copying
                    </span>

                )}
                {selectedEventName && (
                    <h2 className="card-title mb-0 mt-4 text-sm">
                        <FontAwesomeIcon icon="fas faCalendar" /> {selectedEventName}
                    </h2>)}
                {selectedDatabase && (
                    <p className="subtitle mt-0 mb-0 text-sm">
                        {selectedDatabase.Settings.DatabaseNameOverride ?? selectedDatabase.Settings.DatabaseName}
                    </p>)}
            </div>
            <div className="w-full mt-2 mb-2">
                <button
                    type="button"
                    className="btn btn-sm btn-primary m-0"
                    onClick={() => {
                        setIsSelecting(true);
                        setSelectedEventId(undefined);
                    }}
                    disabled={isDisabled || isSelecting}>
                    <FontAwesomeIcon icon="fas faMagnifyingGlass" />
                    Select Database
                </button>
            </div>
            {isSelecting && !selectedEventId && (
                <EventLookupDialog
                    season={season}
                    typeId={eventType}
                    regionId={districtId ? undefined : (regionId ?? undefined)}
                    districtId={districtId ?? undefined}
                    allowBroaderScopes={true}
                    onSelect={e => {
                        if (!e) {
                            if (originalSelection) {
                                setSelectedEventId(originalSelection.eventId);
                                setSelectedEventName(originalSelection.eventName);
                                setSelectedDatabase(originalSelection.database);
                            }
                            else {
                                setSelectedEventId(undefined);
                            }

                            setIsSelecting(false);
                            return;
                        }

                        setSelectedEventId(e.id);
                        setSelectedEventName(e.name);
                    }}
                />)
            }
            {isSelecting && selectedEventId && (
                <EventDatabaseLookupDialog
                    eventId={selectedEventId}
                    isDatabaseOnly={true}
                    isDisabled={isDisabled}
                    onSelect={r => {
                        if (r) {
                            const database = r as OnlineDatabaseSummary;

                            setSelectedDatabase(database);
                            setOriginalSelection({
                                eventId: selectedEventId!,
                                eventName: selectedEventName!,
                                database: database
                            });

                            onSelectDatabase(selectedEventId, JSON.parse(JSON.stringify(database)));
                        }

                        setIsSelecting(false);
                    }}
                />)
            }
        </>);
}