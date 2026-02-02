import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useMemo, useState } from "react";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import type { ReportMeetFilter } from "types/services/DatabaseReportsService";
import EventLookupDialog from "../EventLookupDialog";
import EventDatabaseLookupDialog, { type DatabaseAndMeetLookupResult } from "../EventDatabaseLookupDialog";

interface Props {
    isNewReport: boolean;
    regionId: string | null;
    districtId: string | null;
    eventId: string | null;
    eventName: string | null;
    eventType: string;
    season: number;
    type: "event" | "season";
    hasTeams: boolean;
    hasQuizzers: boolean;
    meets: ReportMeetFilter[];
    setMeets: (meets: ReportMeetFilter[]) => void;
    setReportTitle: (title: string, isReport: boolean) => void;
    getDatabaseUrl: (eventId: string, databaseId: string) => { url: string, useNavigate: boolean };
    isDisabled: boolean;
}

const getMeetCard = (
    eventName: string | null,
    filter: ReportMeetFilter,
    hasQuizzers: boolean,
    navigate: NavigateFunction,
    removeMeet: (meet: ReportMeetFilter) => void,
    getDatabaseUrl: (eventId: string, databaseId: string) => { url: string, useNavigate: boolean },
    setReportTitle: (title: string, isReport: boolean) => void,

    isDisabled: boolean) => {

    return (
        <div
            key={`meet-${filter.EventId}-${filter.DatabaseId}-${filter.MeetId}`}
            className="card live-events-card w-full md:w-80 card-sm shadow-sm border-2 border-solid mt-0"
        >
            <div className="card-body p-2">
                <div className="flex items-start gap-4">
                    <div className="flex-1 mt-2 text-left">
                        <h2 className="card-title mb-0 mt-0">
                            <FontAwesomeIcon icon="fas faCalendar" /> {filter.EventName}
                        </h2>
                        <p className="subtitle mt-0">
                            {filter.MeetName}
                        </p>
                        {hasQuizzers && (
                            <button
                                type="button"
                                className="btn btn-sm btn-warning w-full"
                                onClick={() => alert("TODO: Needs to be implemented.")}
                                disabled={isDisabled}>
                                <FontAwesomeIcon icon="fas faUserTag" /> Manage Quizzers
                            </button>)}
                        <button
                            type="button"
                            className="btn btn-sm btn-primary w-full mt-2"
                            onClick={() => {
                                const { url, useNavigate } = getDatabaseUrl(
                                    filter.EventId,
                                    filter.DatabaseId);

                                if (eventName) {
                                    setReportTitle(eventName, false);
                                }

                                if (useNavigate) {
                                    navigate(url);
                                }
                                else {
                                    window.location.href = url;
                                }
                            }}
                            disabled={isDisabled}>
                            <FontAwesomeIcon icon="fas faCog" /> Manage Settings
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-error w-full mt-2"
                            onClick={() => removeMeet(filter)}
                            disabled={isDisabled}>
                            <FontAwesomeIcon icon="fas faTrash" /> Remove
                        </button>
                    </div>
                </div>
            </div>
        </div>);
}

const getSearchResultsFromFilters = (filters: ReportMeetFilter[]) => {
    const results: DatabaseAndMeetLookupResult[] = [];
    for (const filter of filters) {
        results.push({
            databaseId: filter.DatabaseId,
            meetId: filter.MeetId,
            name: undefined!
        } as DatabaseAndMeetLookupResult);
    }
    return results;
}

export default function EventReportSettingsMeetSelector({
    isNewReport,
    regionId,
    districtId,
    eventId,
    eventName,
    eventType,
    season,
    type,
    meets,
    hasTeams,
    hasQuizzers,
    setMeets,
    getDatabaseUrl,
    setReportTitle,
    isDisabled }: Props) {

    const navigate = useNavigate();

    const [isAdding, setIsAdding] = useState(false);
    const [addingEvent, setAddingEvent] = useState<{ id: string, name: string } | null>(null);

    const unverifiedQuizzers = useMemo(() => {
        let count = 0;
        for (const meet of meets) {
            count += meet.UnverifiedQuizzers ?? 0;
        }

        return count;
    }, [meets]);

    const handleAddMeet = () => {
        setIsAdding(true);

        if (type === "event") {
            setAddingEvent({ id: eventId!, name: eventName! });
        }
    };

    const buttons = (
        <div className="flex flex-wrap gap-2 mt-0 mb-0">
            <button
                type="button"
                className="btn btn-sm btn-primary m-0"
                onClick={handleAddMeet}
                disabled={isDisabled || isAdding}>
                <FontAwesomeIcon icon="fas faPlus" />
                Add Division
            </button>
            {hasTeams && !isNewReport && (
                <button
                    type="button"
                    className="btn btn-sm btn-warning m-0"
                    onClick={() => alert("TODO: Implement Duplicate Teams")}
                    disabled={isDisabled || isAdding}>
                    <FontAwesomeIcon icon="fas faUsersCog" />
                    Manage Duplicate Teams
                </button>)}
        </div>);

    return (
        <>
            <div className="mt-0">

                <div className="divider mt-0 mb-2" />

                {unverifiedQuizzers > 0 && (
                    <div role="alert" className="alert alert-info mb-4">
                        <FontAwesomeIcon icon="far faLightbulb" />
                        <span className="text-base-content">
                            {unverifiedQuizzers} quizzer(s) haven't been verified, which can make multi-event reporting (e.g., ScoreKeep combined report) more difficult. Click
                            any yellow <button type="button" className="btn btn-sm btn-warning"><FontAwesomeIcon icon="fas faUserTag" /></button> below to address this issue.
                        </span>
                    </div>)}

                {buttons}

                <div className="flex flex-wrap gap-2 mt-4 mb-4">
                    {meets.map(meet => getMeetCard(
                        eventName,
                        meet,
                        hasQuizzers,
                        navigate,
                        item => {
                            const updatedMeets = meets.filter(m => m !== item);
                            setMeets(updatedMeets);
                        },
                        getDatabaseUrl,
                        setReportTitle,
                        isDisabled || isAdding))}
                    {meets.length === 0 && (
                        <p className="mt-4 italic w-full text-center">
                            No divisions have been added to this report.
                        </p>
                    )}
                </div>

                {meets.length > 0 && buttons}
            </div>
            {isAdding && !addingEvent && (
                <EventLookupDialog
                    season={season}
                    typeId={eventType}
                    regionId={districtId ? undefined : (regionId ?? undefined)}
                    districtId={districtId ?? undefined}
                    onSelect={e => {
                        if (!e) {
                            setIsAdding(false);
                            setAddingEvent(null);
                            return;
                        }

                        setAddingEvent({ id: e.id!, name: e.name! });
                    }}
                />)}
            {isAdding && addingEvent && (
                <EventDatabaseLookupDialog
                    eventId={addingEvent.id}
                    excludeIds={getSearchResultsFromFilters(meets)}
                    isDisabled={isDisabled}
                    onSelect={r => {
                        if (r) {
                            const newMeets: ReportMeetFilter[] = [...meets];
                            for (const selection of r as DatabaseAndMeetLookupResult[]) {
                                newMeets.push({
                                    EventId: addingEvent.id,
                                    EventName: addingEvent.name,
                                    DatabaseId: selection.databaseId,
                                    MeetId: selection.meetId,
                                    MeetName: selection.name,
                                    UnverifiedQuizzers: 0
                                } as ReportMeetFilter);
                            }

                            setMeets(newMeets);
                        }

                        setIsAdding(false);
                        setAddingEvent(null);
                    }}
                />)}
        </>);
}