import { useState } from "react";
import DatabaseSettingsSection from "./DatabaseSettingsSection";
import { useNavigate, useOutletContext } from "react-router-dom";
import DatabaseSelector from "./DatabaseSelector";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import { OnlineDatabaseSettings } from "types/services/AstroDatabasesService";
import type { EventProviderContext } from "../EventProvider";
import { sharedDirtyWindowState } from "utils/SharedState";

interface Props {
}

export default function ScoringDatabaseNewPage({ }: Props) {

    const {
        auth,
        eventId,
        info,
        rootUrl,
        databases,
        setDatabases } = useOutletContext<EventProviderContext>();
    const navigate = useNavigate();

    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [useClone, setUseClone] = useState<boolean>(false);
    const [cloneEventId, setCloneEventId] = useState<string | undefined>();
    const [cloneDatabaseId, setCloneDatabaseId] = useState<string | undefined>();
    const [clonedSettings, setClonedSettings] = useState<OnlineDatabaseSettings | undefined>();
    const [cloneTeamsAndQuizzers, setCloneTeamsAndQuizzers] = useState<boolean>(false);
    const [cloneAwards, setCloneAwards] = useState<boolean>(true);
    const [cloneSchedule, setCloneSchedule] = useState<boolean>(true);

    if (isProcessing) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">Saving Database ...</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            The database is being saved. This should just take a second or two ...
                        </p>
                    </div>
                </div>
            </div>);
    }

    return (
        <div className="space-y-6 mt-4">
            <h5 className="mb-2">How do you want to create the database?</h5>
            <div className="w-full mb-2">
                <label className="label text-wrap">
                    <input
                        type="radio"
                        name="feeType"
                        className="radio radio-info"
                        checked={!useClone}
                        onChange={e => setUseClone(!e.target.checked)}
                        disabled={isProcessing}
                    />
                    <span className="text-sm">
                        <b>Start Fresh</b><br />
                        Start with a brand new database.
                    </span>
                </label>
            </div>
            <div className="w-full mb-2">
                <label className="label text-wrap">
                    <input
                        type="radio"
                        name="feeType"
                        className="radio radio-info"
                        checked={useClone}
                        onChange={e => setUseClone(e.target.checked)}
                        disabled={isProcessing}
                    />
                    <span className="text-sm">
                        <b>Copy Existing Database</b><br />
                        Start with a copy of an existing database. This can be helpful if you plan on creating
                        a season report as the teams will be considered the same across events.
                    </span>
                </label>
            </div>
            {useClone && (
                <>
                    <div className="divider" />
                    <h5 className="mb-2">What do you want to copy?</h5>
                    <DatabaseSelector
                        key="new-database-page"
                        regionId={info!.RegionId}
                        districtId={info!.DistrictId}
                        eventType={info!.TypeId}
                        season={DataTypeHelpers.getSeasonFromDate(info!.StartDate)!}
                        onSelectDatabase={(eventId, database) => {
                            if (!eventId || !database) {
                                return;
                            }

                            setCloneEventId(eventId);
                            setCloneDatabaseId(database.Settings.DatabaseId!);

                            const clone = database.Settings;
                            clone.DatabaseId = null;
                            clone.DatabaseNameOverride = `${clone.DatabaseNameOverride ?? clone.DatabaseName.replace('_', ' ')} (Copy)`;
                            clone.DatabaseName = null!;

                            setClonedSettings(clone);

                            sharedDirtyWindowState.set(true);
                        }}
                        isDisabled={isProcessing}
                    />
                    <div className="flex gap-4 flex-wrap">
                        <div className="w-full md:w-80 ml-2 mt-1 mb-0">
                            <label className="label text-wrap">
                                <input
                                    type="checkbox"
                                    name="cloneTeamsAndQuizzers"
                                    className="checkbox checkbox-sm checkbox-info"
                                    checked={cloneTeamsAndQuizzers}
                                    onChange={e => {
                                        setCloneTeamsAndQuizzers(e.target.checked);
                                        sharedDirtyWindowState.set(true);
                                    }}
                                />
                                <span>
                                    Copy Teams & Quizzers
                                </span>
                            </label>
                        </div>
                        <div className="w-full md:w-80 ml-2 mt-1 mb-0">
                            <label className="label text-wrap">
                                <input
                                    type="checkbox"
                                    name="cloneAwards"
                                    className="checkbox checkbox-sm checkbox-info"
                                    checked={cloneAwards}
                                    onChange={e => {
                                        setCloneAwards(e.target.checked);
                                        sharedDirtyWindowState.set(true);
                                    }}
                                />
                                <span>
                                    Copy Award Settings
                                </span>
                            </label>
                        </div>
                        <div className="w-full md:w-80 ml-2 mt-1 mb-0">
                            <label className="label text-wrap">
                                <input
                                    type="checkbox"
                                    name="cloneSchedule"
                                    className="checkbox checkbox-sm checkbox-info"
                                    checked={cloneSchedule}
                                    onChange={e => {
                                        setCloneSchedule(e.target.checked);
                                        sharedDirtyWindowState.set(true);
                                    }}
                                />
                                <span>
                                    Copy Schedule Templates
                                </span>
                            </label>
                        </div>
                    </div>
                </>)}
            {(!useClone || clonedSettings) && (
                <>
                    <div className="divider mt-2 mb-2" />
                    <DatabaseSettingsSection
                        auth={auth}
                        eventId={eventId}
                        eventType={info!.TypeId}
                        cloneEventId={cloneEventId}
                        cloneDatabaseId={cloneDatabaseId}
                        cloneTeamsAndQuizzers={cloneTeamsAndQuizzers}
                        cloneAwards={cloneAwards}
                        cloneSchedule={cloneSchedule}
                        settings={clonedSettings}
                        setIsProcessing={setIsProcessing}
                        onSaved={summary => {
                            sharedDirtyWindowState.set(false);
                            setDatabases([...databases, summary]);
                            navigate(`${rootUrl}/scoring/databases/${summary.Settings.DatabaseId}/dashboard`);
                        }}
                    />
                </>)}
        </div>);
}