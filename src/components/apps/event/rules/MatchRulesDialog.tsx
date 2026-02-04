import { useRef, useState } from "react";
import type { EventInfo } from "types/EventTypes";
import { CompetitionType, convertToCompetitionType, type MatchRules } from "types/MatchRules";
import MatchRulesEditor from "./MatchRulesEditor";

interface Props {
    rules: MatchRules;
    defaultType?: string;
    defaultRules: MatchRules;
    onSelect: (newRules: MatchRules | null) => void;
    isReadOnly: boolean;
}

export interface EventInfoCache {
    events: EventInfoWithTypeId[] | undefined;
    season: number | undefined;
}

export interface EventInfoWithTypeId extends EventInfo {
    typeId: string;
}

export default function MatchRulesDialog({
    rules,
    defaultType,
    defaultRules,
    onSelect,
    isReadOnly }: Props) {

    const dialogRef = useRef<HTMLDialogElement>(null);

    const [newRules, setNewRules] = useState<MatchRules>(rules);

    const defaultCompetitionType = convertToCompetitionType(defaultType) ?? CompetitionType.JBQ;

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
                    <MatchRulesEditor
                        rules={rules}
                        defaultType={defaultCompetitionType}
                        defaultRules={defaultRules}
                        onChange={setNewRules}
                        disabled={isReadOnly}
                    />
                </div>
                <div className="mt-4 text-right gap-2 flex justify-end">
                    {!isReadOnly && (
                        <button
                            className="btn btn-warning mt-0"
                            type="button"
                            tabIndex={1}
                            onClick={() => {
                                onSelect(newRules);
                                dialogRef.current?.close();
                            }}>
                            Apply Rules
                        </button>)}
                    <button
                        className="btn btn-warning mt-0"
                        type="button"
                        tabIndex={2}
                        onClick={() => {
                            onSelect(null);
                            dialogRef.current?.close();
                        }}>
                        Close
                    </button>
                </div>
            </div>
        </dialog>);
}