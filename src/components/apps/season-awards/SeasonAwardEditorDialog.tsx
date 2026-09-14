import { useRef, useState } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useModalDialog } from "hooks/useModalDialog";
import { AuthManager } from "types/AuthManager";
import {
    AstroPeopleSeasonAwardsService,
    type OnlinePersonSeasonAward,
    type OnlinePersonSeasonAwardEntry,
} from "types/services/AstroPeopleSeasonAwardsService";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

interface Props {
    award: OnlinePersonSeasonAward;
    season: number;
    witnessName: string;
    onClose: () => void;
    onSaved: () => void;
}

interface EntryFieldsProps {
    entry: OnlinePersonSeasonAwardEntry;
    today: string;
    includeTime?: boolean;
    onChange: (entry: OnlinePersonSeasonAwardEntry) => void;
}

function cloneAward(award: OnlinePersonSeasonAward): OnlinePersonSeasonAward {
    return {
        ...award,
        NationalMemorization: Object.fromEntries(
            Object.entries(award.NationalMemorization).map(([key, entry]) => [
                key,
                entry ? { ...entry } : null,
            ]),
        ),
        MasterMemorization: award.MasterMemorization ? { ...award.MasterMemorization } : null,
        Discipleship: award.Discipleship ? { ...award.Discipleship } : null,
    };
}

function getToday(): string {
    return DataTypeHelpers.formatDate(DataTypeHelpers.nowDateOnly, "yyyy-MM-dd") ?? "";
}

function formatDateForInput(value: string): string {
    return DataTypeHelpers.formatDate(
        DataTypeHelpers.parseDateOnly(value),
        "yyyy-MM-dd",
    ) ?? "";
}

function createEntry(witnessName: string, includeTime: boolean): OnlinePersonSeasonAwardEntry {
    return {
        WitnessName: witnessName,
        OccurredOn: getToday(),
        ...(includeTime ? { TimeSpent: "00:00:00" } : {}),
    };
}

function EntryFields({ entry, today, includeTime = false, onChange }: EntryFieldsProps) {
    return (
        <div className="grid gap-3 md:grid-cols-2 mt-3 pl-6">
            <label className="form-control w-full">
                <span className="label-text mb-1">Witness</span>
                <input
                    type="text"
                    className="input input-bordered w-full"
                    value={entry.WitnessName}
                    required
                    onChange={(event) => onChange({ ...entry, WitnessName: event.target.value })}
                />
            </label>
            <label className="form-control w-full">
                <span className="label-text mb-1">Occurred On</span>
                <input
                    type="date"
                    className="input input-bordered w-full"
                    value={formatDateForInput(entry.OccurredOn)}
                    max={today}
                    required
                    onChange={(event) => onChange({ ...entry, OccurredOn: event.target.value })}
                />
            </label>
            {includeTime && (
                <label className="form-control w-full md:col-span-2">
                    <span className="label-text mb-1">Time Spent</span>
                    <input
                        type="time"
                        className="input input-bordered w-full max-w-xs"
                        value={DataTypeHelpers.formatTimeSpanAsTime(entry.TimeSpent) ?? "00:00"}
                        required
                        onChange={(event) => {
                            const parsed = DataTypeHelpers.parseTimeSpan(event.target.value);
                            onChange({
                                ...entry,
                                TimeSpent: parsed
                                    ? DataTypeHelpers.formatTimeSpan(parsed.hours, parsed.minutes, 0)
                                    : "00:00:00",
                            });
                        }}
                    />
                </label>
            )}
        </div>
    );
}

function validateEntry(
    label: string,
    entry: OnlinePersonSeasonAwardEntry,
    today: string,
    requireTime: boolean,
): string | null {
    if (!entry.WitnessName.trim()) {
        return `${label} requires a witness.`;
    }

    const occurredOn = formatDateForInput(entry.OccurredOn);
    if (!occurredOn) {
        return `${label} requires a valid occurrence date.`;
    }
    if (occurredOn > today) {
        return `${label} cannot have a future occurrence date.`;
    }

    if (requireTime) {
        const minutes = DataTypeHelpers.parseTimeSpanAsMinutes(entry.TimeSpent);
        if (minutes === null || minutes <= 0) {
            return `${label} requires a non-zero time spent.`;
        }
    }

    return null;
}

export default function SeasonAwardEditorDialog({
    award,
    season,
    witnessName,
    onClose,
    onSaved,
}: Props) {
    const auth = AuthManager.useNanoStore();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [draft, setDraft] = useState(() => cloneAward(award));
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const today = getToday();
    useModalDialog(dialogRef, onClose, isSaving);

    function validate(): string | null {
        for (const [key, entry] of Object.entries(draft.NationalMemorization)) {
            if (entry) {
                const entryError = validateEntry(key, entry, today, false);
                if (entryError) {
                    return entryError;
                }
            }
        }

        if (draft.MasterMemorization) {
            const entryError = validateEntry(
                "Master Memorization",
                draft.MasterMemorization,
                today,
                true,
            );
            if (entryError) {
                return entryError;
            }
        }

        if (draft.Discipleship) {
            return validateEntry("Discipleship", draft.Discipleship, today, false);
        }

        return null;
    }

    async function save(): Promise<void> {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSaving(true);
        setError(null);
        try {
            await AstroPeopleSeasonAwardsService.updateAwards(auth, season, draft);
            onSaved();
        } catch (saveError: unknown) {
            setError(saveError instanceof Error ? saveError.message : "Unknown error");
            setIsSaving(false);
        }
    }

    return (
        <dialog ref={dialogRef} className="modal">
            <div className="modal-box w-full max-w-4xl">
                <h2 className="text-xl font-bold mt-0">Season Awards: {draft.PersonName}</h2>
                <p className="mt-1 mb-4 opacity-75">
                    {draft.ChurchName}{draft.ChurchLocation ? `, ${draft.ChurchLocation}` : ""}
                </p>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    aria-label="Close"
                    disabled={isSaving}
                    onClick={onClose}
                >
                    <FontAwesomeIcon icon="fas faXmark" />
                </button>

                {error && (
                    <div role="alert" className="alert alert-error mb-4">
                        <FontAwesomeIcon icon="fas faCircleExclamation" />
                        <span>{error}</span>
                    </div>
                )}

                <fieldset className="fieldset border-base-300 rounded-box border p-4">
                    <legend className="fieldset-legend text-base">National Memorization</legend>
                    <div className="space-y-4">
                        {Object.entries(draft.NationalMemorization).map(([key, entry]) => (
                            <div key={key}>
                                <label className="flex items-center gap-2 font-medium cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-sm"
                                        checked={entry !== null}
                                        disabled={isSaving}
                                        onChange={(event) => setDraft((current) => ({
                                            ...current,
                                            NationalMemorization: {
                                                ...current.NationalMemorization,
                                                [key]: event.target.checked ? createEntry(witnessName, false) : null,
                                            },
                                        }))}
                                    />
                                    {key}
                                </label>
                                {entry && (
                                    <EntryFields
                                        entry={entry}
                                        today={today}
                                        onChange={(updatedEntry) => setDraft((current) => ({
                                            ...current,
                                            NationalMemorization: {
                                                ...current.NationalMemorization,
                                                [key]: updatedEntry,
                                            },
                                        }))}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </fieldset>

                <fieldset className="fieldset border-base-300 rounded-box border p-4 mt-4">
                    <legend className="fieldset-legend text-base">Master Memorization</legend>
                    <label className="flex items-center gap-2 font-medium cursor-pointer">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={draft.MasterMemorization !== null}
                            disabled={isSaving}
                            onChange={(event) => setDraft((current) => ({
                                ...current,
                                MasterMemorization: event.target.checked ? createEntry(witnessName, true) : null,
                            }))}
                        />
                        Completed
                    </label>
                    {draft.MasterMemorization && (
                        <EntryFields
                            entry={draft.MasterMemorization}
                            today={today}
                            includeTime
                            onChange={(entry) => setDraft((current) => ({ ...current, MasterMemorization: entry }))}
                        />
                    )}
                </fieldset>

                <fieldset className="fieldset border-base-300 rounded-box border p-4 mt-4">
                    <legend className="fieldset-legend text-base">Discipleship</legend>
                    <label className="flex items-center gap-2 font-medium cursor-pointer">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={draft.Discipleship !== null}
                            disabled={isSaving}
                            onChange={(event) => setDraft((current) => ({
                                ...current,
                                Discipleship: event.target.checked ? createEntry(witnessName, false) : null,
                            }))}
                        />
                        Completed
                    </label>
                    {draft.Discipleship && (
                        <EntryFields
                            entry={draft.Discipleship}
                            today={today}
                            onChange={(entry) => setDraft((current) => ({ ...current, Discipleship: entry }))}
                        />
                    )}
                </fieldset>

                <div className="modal-action">
                    <button type="button" className="btn btn-warning mt-0" disabled={isSaving} onClick={onClose}>Cancel</button>
                    <button type="button" className="btn btn-primary mt-0" disabled={isSaving} onClick={() => void save()}>
                        {isSaving && <span className="loading loading-spinner loading-sm"></span>}
                        Save
                    </button>
                </div>
            </div>
        </dialog>
    );
}