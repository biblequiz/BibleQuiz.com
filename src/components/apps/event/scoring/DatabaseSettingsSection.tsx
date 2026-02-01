import { useState, useEffect, useRef } from "react";
import { AstroDatabasesService, OnlineDatabaseSettings, OnlineDatabaseSummary } from "types/services/AstroDatabasesService";
import { sharedDirtyWindowState } from "utils/SharedState";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import type { AuthManager } from "types/AuthManager";
import { useStore } from "@nanostores/react";
import FontAwesomeIcon from "components/FontAwesomeIcon";

interface Props {
    auth: AuthManager;
    eventId: string;
    databaseName?: string;
    settings?: OnlineDatabaseSettings | null;
    onSaved: (settings: OnlineDatabaseSummary) => void;
    disabled?: boolean;
}

const DEFAULT_START_TIME = "09:00:00";

/**
 * Section to edit database settings.
 */
export default function DatabaseSettingsSection({
    auth,
    eventId,
    settings,
    onSaved,
    disabled = false
}: Props) {

    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [savingError, setSavingError] = useState<string | null>(null);
    const [databaseName, setDatabaseName] = useState<string | undefined>(settings?.DatabaseName || "");
    const [databaseNameOverride, setDatabaseNameOverride] = useState<string | undefined>(settings?.DatabaseNameOverride ?? undefined);
    const [defaultMatchStartTime, setDefaultMatchStartTime] = useState<string>(settings?.DefaultMatchStartTime ?? DEFAULT_START_TIME);
    const [intermediateMatchStartTime, setIntermediateMatchStartTime] = useState<string | undefined>();
    const [defaultMatchLengthInMinutes, setDefaultMatchLengthInMinutes] = useState<number | undefined>(settings?.DefaultMatchLengthInMinutes);
    const [contactInfo, setContactInfo] = useState<string | undefined>(settings?.ContactInfo);

    const formRef = useRef<HTMLFormElement>(null);
    const hasChanges = useStore(sharedDirtyWindowState);

    const handleSave = (e: React.MouseEvent | React.FormEvent) => {
        e.preventDefault();

        if (!formRef.current!.reportValidity()) {
            return;
        }

        const updatedSettings = new OnlineDatabaseSettings();
        updatedSettings.DatabaseName = databaseName!;
        updatedSettings.DatabaseNameOverride = databaseNameOverride || null;
        updatedSettings.DefaultMatchStartTime = defaultMatchStartTime;
        updatedSettings.DefaultMatchLengthInMinutes = defaultMatchLengthInMinutes!;
        updatedSettings.ContactInfo = contactInfo!;
        updatedSettings.Rules = settings?.Rules ?? null;

        setIsSaving(true);

        AstroDatabasesService.createOrUpdateDatabase(
            auth,
            eventId,
            updatedSettings)
            .then(saved => {
                onSaved(saved);
                sharedDirtyWindowState.set(false);
            })
            .catch(err => {
                setIsSaving(false);
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
            {savingError && (
                <div role="alert" className="alert alert-error mt-0 w-full">
                    <FontAwesomeIcon icon="fas faCircleExclamation" />
                    <div>
                        <b>Error: </b> {savingError}
                    </div>
                </div>)}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control w-full">
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
                        disabled={disabled}
                        maxLength={50}
                        required
                        pattern="[a-zA-Z0-9_]+"
                        title="Only letters, numbers, and underscores are allowed"
                    />
                </div>

                <div className="form-control w-full">
                    <label className="label">
                        <span className="label-text font-medium text-sm">Optional Display Name</span>
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
                        disabled={disabled}
                        maxLength={50}
                    />
                </div>

                <div className="form-control w-full">
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
                            setIntermediateMatchStartTime(undefined);

                            sharedDirtyWindowState.set(true);
                        }}
                        disabled={disabled}
                        required
                    />
                </div>

                <div className="form-control w-full">
                    <label className="label">
                        <span className="label-text font-medium text-sm">Default Match Length (minutes)</span>
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
                        disabled={disabled}
                    />
                </div>

                <div className="form-control w-full">
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
                        disabled={disabled}
                        required
                    />
                </div>
            </div>

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