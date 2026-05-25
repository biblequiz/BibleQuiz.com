import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { useStore } from "@nanostores/react";
import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import {
    DatabasesService,
    AwardType,
    type DatabaseAwards,
    type DatabaseAwardsMeet,
    type DatabaseAwardsOutput
} from "types/services/DatabasesService";
import { sharedDirtyWindowState } from "utils/SharedState";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import AwardOutputSection from "./awards/AwardOutputSection";

export default function ScoringDatabaseAwardsPage() {
    const {
        auth,
        eventId,
        databaseId
    } = useOutletContext<ScoringDatabaseProviderContext>();

    const isDirty = useStore(sharedDirtyWindowState);

    // Loading state
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Saving state
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);

    // Award settings
    const [awardSettings, setAwardSettings] = useState<DatabaseAwards | null>(null);
    const [datesLabel, setDatesLabel] = useState("");
    const [meets, setMeets] = useState<DatabaseAwardsMeet[]>([]);
    const [teamsOutput, setTeamsOutput] = useState<DatabaseAwardsOutput | null>(null);
    const [individualsOutput, setIndividualsOutput] = useState<DatabaseAwardsOutput | null>(null);

    // Load award settings
    useEffect(() => {
        if (!eventId || !databaseId) return;

        setIsLoading(true);
        setLoadError(null);

        DatabasesService.getAwardsSettings(auth, eventId, databaseId)
            .then(settings => {
                setAwardSettings(settings);
                setDatesLabel(settings.DatesLabel || "");
                setMeets(settings.Meets.map(m => ({ ...m })));
                setTeamsOutput({ ...settings.Teams, AllTemplates: [...settings.Teams.AllTemplates] });
                setIndividualsOutput({ ...settings.Individuals, AllTemplates: [...settings.Individuals.AllTemplates] });
                setIsLoading(false);
            })
            .catch(err => {
                setLoadError(err.message || "Failed to load award settings.");
                setIsLoading(false);
            });
    }, [auth, eventId, databaseId]);

    // Mark as dirty when changes are made
    const markDirty = useCallback(() => {
        sharedDirtyWindowState.set(true);
        setIsSaved(false);
    }, []);

    // Handle dates label change
    const handleDatesLabelChange = (value: string) => {
        setDatesLabel(value);
        markDirty();
    };

    // Handle meet checkbox change
    const handleMeetChange = (meetId: number, isIncluded: boolean) => {
        setMeets(prev => prev.map(m =>
            m.Id === meetId ? { ...m, IsIncluded: isIncluded } : m
        ));
        markDirty();
    };

    // Handle teams output change
    const handleTeamsOutputChange = (output: DatabaseAwardsOutput) => {
        setTeamsOutput(output);
        markDirty();
    };

    // Handle individuals output change
    const handleIndividualsOutputChange = (output: DatabaseAwardsOutput) => {
        setIndividualsOutput(output);
        markDirty();
    };

    // Save settings before generating report
    const saveSettings = useCallback(async (): Promise<boolean> => {
        if (!awardSettings || !teamsOutput || !individualsOutput) return false;

        const updatedSettings: DatabaseAwards = {
            ...awardSettings,
            DatesLabel: datesLabel,
            Meets: meets,
            Teams: teamsOutput,
            Individuals: individualsOutput
        };

        try {
            await DatabasesService.updateAwardsSettings(
                auth,
                eventId,
                databaseId!,
                updatedSettings
            );
            sharedDirtyWindowState.set(false);
            return true;
        } catch (err: any) {
            throw err;
        }
    }, [auth, eventId, databaseId, awardSettings, datesLabel, meets, teamsOutput, individualsOutput]);

    // Handle generate report
    const handleGenerateReport = useCallback(async (link: string) => {
        // Save changes first if dirty
        if (isDirty) {
            setIsSaving(true);
            setSaveError(null);

            try {
                await saveSettings();
                setIsSaved(true);
            } catch (err: any) {
                setSaveError(err.message || "Failed to save settings.");
                setIsSaving(false);
                return;
            }

            setIsSaving(false);
        }

        // Open the report
        window.open(link);
    }, [isDirty, saveSettings]);

    // Handle manual save
    const handleSave = useCallback(async () => {
        setIsSaving(true);
        setSaveError(null);
        setIsSaved(false);

        try {
            await saveSettings();
            setIsSaved(true);
        } catch (err: any) {
            setSaveError(err.message || "Failed to save settings.");
        } finally {
            setIsSaving(false);
        }
    }, [saveSettings]);

    // Check if any meets are selected
    const hasAnyCheckedMeets = meets.some(m => m.IsIncluded);

    // Loading state
    if (isLoading) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">Loading Award Settings...</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            Downloading the latest award settings. This should just take a second.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (loadError) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <FontAwesomeIcon icon="fas faTriangleExclamation" />
                            <span className="ml-4">Error</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            {loadError}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h3 className="text-lg font-semibold mb-0">Awards</h3>
                <button
                    type="button"
                    className="btn btn-success btn-sm mt-0 mb-0"
                    onClick={handleSave}
                    disabled={!isDirty || isSaving}
                >
                    {isSaving ? (
                        <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Saving...
                        </>
                    ) : (
                        <>
                            <FontAwesomeIcon icon="fas faSave" />
                            Save Changes
                        </>
                    )}
                </button>
            </div>

            {/* Error/Success Messages */}
            {saveError && (
                <div role="alert" className="alert alert-error">
                    <FontAwesomeIcon icon="fas faTriangleExclamation" />
                    <div>
                        <b>Error: </b>{saveError}
                    </div>
                </div>
            )}

            {isSaved && (
                <div className="alert alert-success rounded-2xl">
                    <FontAwesomeIcon icon="fas faCircleCheck" />
                    <span>Settings saved successfully.</span>
                </div>
            )}

            {/* Labels Section */}
            <div className="card border-2 border-primary/40">
                <div className="card-body">
                    <h4 className="card-title text-md">
                        <FontAwesomeIcon icon="fas faTags" />
                        Labels
                    </h4>
                    <div className="w-full max-w-md flex flex-col gap-2">
                        <label className="label py-0">
                            <span className="label-text">Dates to Display on Awards</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            placeholder="e.g., January 15-17, 2026"
                            maxLength={60}
                            value={datesLabel}
                            onChange={e => handleDatesLabelChange(e.target.value)}
                            disabled={isSaving}
                        />
                        <label className="label py-0">
                            <span className="label-text-alt">This text will appear on the generated awards</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Divisions Section */}
            <div className="card border-2 border-primary/40">
                <div className="card-body">
                    <h4 className="card-title text-md">
                        <FontAwesomeIcon icon="fas faLayerGroup" />
                        Divisions
                    </h4>
                    {meets.length === 0 ? (
                        <p className="text-base-content/60 italic">No divisions available.</p>
                    ) : (
                        <div className="space-y-2 mt-2 mb-0">
                            {meets.map(meet => (
                                <label
                                    key={meet.Id}
                                    className={`flex items-center gap-3 p-2 rounded-lg hover:bg-base-300 cursor-pointer mb-0 mt-0 ${!meet.HasScores ? "opacity-60" : ""}`}
                                >
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary"
                                        checked={meet.IsIncluded}
                                        onChange={e => handleMeetChange(meet.Id, e.target.checked)}
                                        disabled={isSaving || !meet.HasScores}
                                    />
                                    <span className="flex-1">
                                        {meet.Name}
                                        {!meet.HasScores && (
                                            <span className="text-sm text-base-content/60 ml-2 italic">
                                                • Excluding due to no scores
                                            </span>
                                        )}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Teams and Individuals Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Teams */}
                {teamsOutput && (
                    <AwardOutputSection
                        auth={auth}
                        eventId={eventId}
                        databaseId={databaseId!}
                        type={AwardType.Team}
                        typeName="Teams"
                        icon="fas faUsers"
                        output={teamsOutput}
                        datesLabel={datesLabel}
                        hasAnyCheckedMeets={hasAnyCheckedMeets}
                        isIndividual={false}
                        disabled={isSaving}
                        onOutputChange={handleTeamsOutputChange}
                        onGenerateReport={handleGenerateReport}
                    />
                )}

                {/* Individuals */}
                {individualsOutput && (
                    <AwardOutputSection
                        auth={auth}
                        eventId={eventId}
                        databaseId={databaseId!}
                        type={AwardType.Quizzer}
                        typeName="Individuals"
                        icon="fas faUser"
                        output={individualsOutput}
                        datesLabel={datesLabel}
                        hasAnyCheckedMeets={hasAnyCheckedMeets}
                        isIndividual={true}
                        disabled={isSaving}
                        onOutputChange={handleIndividualsOutputChange}
                        onGenerateReport={handleGenerateReport}
                    />
                )}
            </div>
        </div>
    );
}