import { useState, useEffect, useRef } from "react";
import { AstroDatabasesService, OnlineDatabaseSettings, OnlineDatabaseSummary } from "types/services/AstroDatabasesService";
import { sharedDirtyWindowState } from "utils/SharedState";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import type { AuthManager } from "types/AuthManager";
import { useStore } from "@nanostores/react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import ScoringDatabaseScoreKeepAlert from "./ScoringDatabaseScoreKeepAlert";
import { MatchRules } from "types/MatchRules";

interface Props {
    auth: AuthManager;
    eventId: string;
    settings?: OnlineDatabaseSettings | null;
    defaultRules?: MatchRules;
    cloneEventId?: string;
    cloneDatabaseId?: string;
    cloneTeamsAndQuizzers?: boolean;
    cloneAwards?: boolean;
    cloneSchedule?: boolean;
    setIsProcessing: (isSaving: boolean) => void;
    onSaved: (settings: OnlineDatabaseSummary) => void;
    disabled?: boolean;
}

const DEFAULT_START_TIME = "09:00:00";
const DEFAULT_MATCH_LENGTH = 30;

function generateDatabaseNameFromDisplayName(value: string): string {
    return value
        .replace(/[^a-zA-Z0-9_\\-]/g, "_")  // Replace non-alphanumeric with underscore
        .replace(/_+/g, "_")              // Consolidate multiple underscores
        .replace(/_+$/g, "");             // Trim trailing underscores
}

/**
 * Section to edit database settings.
 */
export default function DatabaseSettingsSection({
    auth,
    eventId,
    settings,
    defaultRules,
    cloneEventId,
    cloneDatabaseId,
    cloneTeamsAndQuizzers = false,
    cloneAwards = true,
    cloneSchedule = true,
    setIsProcessing,
    onSaved,
    disabled = false
}: Props) {

    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [savingError, setSavingError] = useState<string | null>(null);
    const [databaseName, setDatabaseName] = useState<string | undefined>(settings?.DatabaseName || "");
    const [databaseNameOverride, setDatabaseNameOverride] = useState<string | undefined>(settings?.DatabaseNameOverride ?? undefined);
    const [defaultMatchStartTime, setDefaultMatchStartTime] = useState<string>(settings?.DefaultMatchStartTime ?? DEFAULT_START_TIME);
    const [intermediateMatchStartTime, setIntermediateMatchStartTime] = useState<string | undefined>();
    const [defaultMatchLengthInMinutes, setDefaultMatchLengthInMinutes] = useState<number | undefined>(settings?.DefaultMatchLengthInMinutes ?? DEFAULT_MATCH_LENGTH);
    const [contactInfo, setContactInfo] = useState<string | undefined>(settings?.ContactInfo);
    const [rules, setRules] = useState<MatchRules | undefined>(settings?.Rules || undefined);

    const formRef = useRef<HTMLFormElement>(null);
    const hasChanges = useStore(sharedDirtyWindowState);
    const isScoreKeep = ((!cloneEventId || !cloneDatabaseId) && settings?.IsScoreKeep) || false;

    const handleSave = (e: React.MouseEvent | React.FormEvent) => {
        e.preventDefault();

        if (!formRef.current!.reportValidity()) {
            return;
        }

        const displayName = databaseNameOverride && databaseNameOverride.trim().length > 0
            ? databaseNameOverride.trim()
            : undefined;
        const resolvedDatabaseName = databaseName || generateDatabaseNameFromDisplayName(displayName || "");

        const updatedSettings = new OnlineDatabaseSettings();
        updatedSettings.DatabaseId = settings?.DatabaseId ?? null;
        updatedSettings.DatabaseName = resolvedDatabaseName;
        updatedSettings.DatabaseNameOverride = databaseNameOverride || null;
        updatedSettings.DefaultMatchStartTime = defaultMatchStartTime;
        updatedSettings.DefaultMatchLengthInMinutes = defaultMatchLengthInMinutes!;
        updatedSettings.ContactInfo = contactInfo!;
        updatedSettings.Rules = settings?.Rules ?? null;

        setIsSaving(true);
        setSavingError(null);
        setIsProcessing(true);

        // Do the operation.
        const operationPromise = cloneEventId && cloneDatabaseId
            ? AstroDatabasesService.cloneDatabase(
                auth,
                cloneEventId,
                cloneDatabaseId,
                eventId,
                updatedSettings,
                cloneTeamsAndQuizzers,
                cloneAwards,
                cloneSchedule)
            : AstroDatabasesService.createOrUpdateDatabase(
                auth,
                eventId,
                updatedSettings);

        operationPromise
            .then(saved => {
                setIsSaving(false);
                setIsProcessing(false);
                onSaved(saved);
                sharedDirtyWindowState.set(false);
            })
            .catch(err => {
                setIsSaving(false);
                setIsProcessing(false);
                setSavingError(err.message || "An error occurred while saving the settings.");
            });
    };

    useEffect(() => {
        if (settings) {
            setDatabaseName(settings.DatabaseName!);
            setDatabaseNameOverride(settings.DatabaseNameOverride!);
            setDefaultMatchStartTime(settings.DefaultMatchStartTime);
            setDefaultMatchLengthInMinutes(settings.DefaultMatchLengthInMinutes);
            setContactInfo(settings.ContactInfo);
        }
    }, [settings]);

    return (
        <form ref={formRef} className="space-y-6 mt-0" onSubmit={handleSave}>
            <ScoringDatabaseScoreKeepAlert isScoreKeep={isScoreKeep} />
            {savingError && (
                <div role="alert" className="alert alert-error mt-0 w-full">
                    <FontAwesomeIcon icon="fas faCircleExclamation" />
                    <div>
                        <b>Error: </b>
                        {savingError.indexOf("<br />") >= 0
                            ? (<span dangerouslySetInnerHTML={{ __html: savingError }} />)
                            : (<span>{savingError}</span>)}
                    </div>
                </div>)}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {isScoreKeep && (
                    <div className="form-control w-full mt-0">
                        <label className="label">
                            <span className="label-text font-medium text-sm">Database Name</span>
                            <span className="label-text-alt text-error">*</span>
                        </label>
                        <input
                            type="text"
                            className="input w-full"
                            placeholder="Name of the database file"
                            value={databaseName}
                            onChange={e => {
                                setDatabaseName(e.target.value);
                                sharedDirtyWindowState.set(true);
                            }}
                            disabled={disabled || isSaving || isScoreKeep}
                            maxLength={50}
                            required
                            pattern="[a-zA-Z0-9_]+"
                            title="Only letters, numbers, and underscores are allowed"
                        />
                    </div>)}

                <div className="form-control w-full mt-0">
                    <label className="label">
                        <span className="label-text font-medium text-sm">
                            {isScoreKeep ? "Optional Display Name" : "Display Name"}
                        </span>
                        {!isScoreKeep && <span className="label-text-alt text-error">*</span>}
                    </label>
                    <input
                        type="text"
                        className="input w-full"
                        placeholder="Display name for the database"
                        value={databaseNameOverride}
                        onChange={e => {
                            setDatabaseNameOverride(e.target.value);
                            sharedDirtyWindowState.set(true);
                        }}
                        required={!isScoreKeep}
                        disabled={disabled || isSaving}
                        maxLength={50}
                    />
                </div>

                <div className="form-control w-full mt-0">
                    <label className="label">
                        <span className="label-text font-medium text-sm">Contact Info</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                    <input
                        type="text"
                        className="input w-full"
                        maxLength={120}
                        value={contactInfo}
                        onChange={e => {
                            const value = e.target.value;
                            setContactInfo(value);
                            sharedDirtyWindowState.set(true);
                        }}
                        disabled={disabled || isSaving || isScoreKeep}
                        required
                    />
                </div>

                <div className="form-control w-full mt-0">
                    <label className="label">
                        <span className="label-text font-medium text-sm">Default Start Time</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                    <input
                        type="time"
                        className="input w-full"
                        value={intermediateMatchStartTime ?? defaultMatchStartTime}
                        onChange={e => setIntermediateMatchStartTime(e.target.value)}
                        onBlur={() => {
                            const timeValue = intermediateMatchStartTime ?? defaultMatchStartTime ?? DEFAULT_START_TIME;

                            const parts = timeValue.split(":");
                            const hours = parts.length > 0 ? parseInt(parts[0]) : 0;
                            const minutes = parts.length > 1 ? parseInt(parts[1]) : 0;

                            setDefaultMatchStartTime(DataTypeHelpers.formatTimeSpan(hours, minutes));

                            sharedDirtyWindowState.set(true);
                        }}
                        disabled={disabled || isSaving || isScoreKeep}
                        required
                    />
                </div>

                <div className="form-control w-full mt-0">
                    <label className="label">
                        <span className="label-text font-medium text-sm">Default Match Length (minutes)</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                    <input
                        type="number"
                        className="input w-full"
                        min={1}
                        max={120}
                        value={defaultMatchLengthInMinutes}
                        onChange={e => {
                            const value = parseInt(e.target.value) || 20;
                            setDefaultMatchLengthInMinutes(value);
                            sharedDirtyWindowState.set(true);
                        }}
                        disabled={disabled || isSaving || isScoreKeep}
                        required
                    />
                </div>
            </div>

            {settings?.Rules && defaultRules && (
                <div className="form-control w-full mt-0 border border-base-500 rounded-lg p-4">
                    <span
                        className="text-xs"
                        dangerouslySetInnerHTML={{ __html: MatchRules.toHtmlString(settings.Rules) }} />
                    <button
                        type="button"
                        className="btn btn-sm btn-secondary mt-4 w-full text-sm"
                        onClick={() => {
                            alert("Show Rules Editor");
                        }}
                        disabled={isSaving || disabled}>
                        <FontAwesomeIcon icon="fas faPencil" />
                        Edit Default Rules for Database
                    </button>
                </div>)}

            <button
                type="submit"
                className="btn btn-sm btn-success m-0"
                onClick={handleSave}
                disabled={!hasChanges || isSaving || disabled}>
                <FontAwesomeIcon icon="fas faFloppyDisk" />
                Save Changes
            </button>
        </form>);
}