import { useState } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";

interface Props {
    divisionCount: number;
    enableElectronicScoring: (scoringCode: string) => Promise<void>;
}

/** Suggests an easy-to-type scoring code (no look-alike characters such as 0/O or 1/I). */
function suggestScoringCode(): string {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += characters[Math.floor(Math.random() * characters.length)];
    }

    return code;
}

/**
 * Warns that divisions have EZScore checked while electronic scoring is not enabled for the event, and
 * offers to enable it with a scoring code.
 */
export default function ScoringDatabaseEnableScoringAlert({ divisionCount, enableElectronicScoring }: Props) {

    const [scoringCode, setScoringCode] = useState<string>(() => suggestScoringCode());
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleEnable = (e: React.FormEvent) => {
        e.preventDefault();

        setIsSaving(true);
        setError(null);
        enableElectronicScoring(scoringCode.trim())
            .catch(err => setError(err?.message || "An error occurred while enabling electronic scoring."))
            .finally(() => setIsSaving(false));
    };

    return (
        <div role="alert" className="alert alert-warning alert-outline mt-4 w-full flex-col items-start">
            <div>
                <FontAwesomeIcon icon="fas faTriangleExclamation" />
                <span className="ml-2">
                    <b>Electronic scoring is not enabled for this event.</b> {divisionCount === 1
                        ? "A division has"
                        : `${divisionCount} divisions have`} EZScore checked, but scorers cannot connect
                    until electronic scoring is turned on. You can also change this later under Scoring / General
                    or Registration / Other.
                </span>
            </div>
            <form className="flex flex-wrap items-end gap-2" onSubmit={handleEnable}>
                <div className="form-control">
                    <label className="label py-0">
                        <span className="label-text text-sm">Scoring Code</span>
                    </label>
                    <input
                        type="text"
                        className="input input-sm"
                        value={scoringCode}
                        onChange={e => setScoringCode(e.target.value)}
                        maxLength={50}
                        required
                        disabled={isSaving}
                    />
                </div>
                <button type="submit" className="btn btn-sm btn-warning mt-0" disabled={isSaving || !scoringCode.trim()}>
                    <FontAwesomeIcon icon="fas faBolt" />
                    Enable Electronic Scoring
                </button>
            </form>
            {error && <span className="text-error">{error}</span>}
        </div>);
}
