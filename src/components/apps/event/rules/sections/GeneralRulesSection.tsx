import CollapsibleSection from "components/CollapsibleSection";
import type { GeneralRulesState } from "../hooks/useMatchRulesForm";

interface Props {
    state: GeneralRulesState;
    onChange: (updates: Partial<GeneralRulesState>) => void;
    disabled?: boolean;
}

export default function GeneralRulesSection({ state, onChange, disabled = false }: Props) {
    return (
        <CollapsibleSection
            pageId="matchRulesEditor"
            elementId="generalRules"
            icon="fas faCog"
            title="General Match Rules"
            titleClass="mt-4"
            defaultOpen={true}
            allowMultipleOpen={true}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-0 p-2">
                <div className="form-control w-full mt-0">
                    <label className="label">
                        <span className="label-text font-medium">Competition Abbreviation</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                    <input
                        type="text"
                        className="input w-full"
                        value={state.competitionName}
                        onChange={e => onChange({ competitionName: e.target.value })}
                        disabled={disabled}
                        maxLength={20}
                        required
                    />
                </div>
                <div className="form-control w-full mt-0">
                    <label className="label">
                        <span className="label-text font-medium">Full Competition Name</span>
                    </label>
                    <input
                        type="text"
                        className="input w-full"
                        value={state.competitionFullName}
                        onChange={e => onChange({ competitionFullName: e.target.value })}
                        disabled={disabled}
                        maxLength={50}
                    />
                </div>
                <div className="form-control w-full mt-0">
                    <label className="label">
                        <span className="label-text font-medium">Max Quizzers at Table</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                    <input
                        type="number"
                        className="input w-full"
                        value={state.quizzersPerTeam}
                        onChange={e => onChange({ quizzersPerTeam: parseInt(e.target.value) || 3 })}
                        disabled={disabled}
                        min={1}
                        max={10}
                        required
                    />
                </div>
                <div className="form-control w-full mt-0">
                    <label className="label">
                        <span className="label-text font-medium">Max Timeouts per Match</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                    <input
                        type="number"
                        className="input w-full"
                        value={state.maxTimeouts}
                        onChange={e => onChange({ maxTimeouts: parseInt(e.target.value) || 0 })}
                        disabled={disabled}
                        min={0}
                        max={10}
                        required
                    />
                </div>
                <div className="form-control w-full mt-0">
                    <label className="label">
                        <span className="label-text font-medium">Max. Rereads</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                    <select
                        className="select w-full mt-0 mb-0"
                        value={state.rereadCount}
                        onChange={e => onChange({ rereadCount: parseInt(e.target.value) })}
                        disabled={disabled}
                        required
                    >
                        <option value={0}>0</option>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                    </select>
                </div>
                {state.isIndividualCompetition && (
                    <div className="form-control w-full mt-0">
                        <label className="label">
                            <span className="label-text font-medium">Bonus for Winners in Finals</span>
                        </label>
                        <input
                            type="number"
                            className="input w-full"
                            value={state.finalMatchWinnerBonus ?? ""}
                            onChange={e => {
                                const parsed = parseInt(e.target.value);
                                onChange({ finalMatchWinnerBonus: isNaN(parsed) ? null : parsed });
                            }}
                            disabled={disabled}
                            min={1}
                            step={1}
                        />
                    </div>
                )}
            </div>
        </CollapsibleSection>
    );
}