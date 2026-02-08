import CollapsibleSection from "components/CollapsibleSection";
import type { TimerRulesState } from "../hooks/useMatchRulesForm";

interface Props {
    state: TimerRulesState;
    onChange: (updates: Partial<TimerRulesState>) => void;
    disabled?: boolean;
}

export default function TimerRulesSection({ state, onChange, disabled = false }: Props) {
    return (
        <CollapsibleSection
            pageId="matchRulesEditor"
            elementId="timer"
            icon="fas faStopwatch"
            title="Countdown Match Timer"
            titleClass="mt-4"
            allowMultipleOpen={true}
        >
            <div className="p-2 space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <label className="label cursor-pointer gap-2 p-0">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-info"
                            checked={state.enabled}
                            onChange={e => onChange({ enabled: e.target.checked })}
                            disabled={disabled}
                        />
                        <span className="label-text text-base-content">Start Timer in EZScore at</span>
                    </label>
                    <input
                        type="number"
                        className="input input-sm w-20"
                        value={state.initial}
                        onChange={e => onChange({ initial: parseInt(e.target.value) || 0 })}
                        disabled={disabled || !state.enabled}
                        min={1}
                        max={180}
                    />
                    <span className="label-text text-base-content">minutes</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 mt-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <label className="label cursor-pointer gap-2 p-0">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-sm checkbox-info"
                                checked={state.warnEnabled}
                                onChange={e => onChange({ warnEnabled: e.target.checked })}
                                disabled={disabled || !state.enabled}
                            />
                            <span className="label-text text-base-content">Warn at</span>
                        </label>
                        <input
                            type="number"
                            className="input input-sm w-20"
                            value={state.warn}
                            onChange={e => onChange({ warn: parseInt(e.target.value) || 0 })}
                            disabled={disabled || !state.enabled || !state.warnEnabled}
                            min={0}
                            max={180}
                        />
                        <span className="label-text">minutes</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-0">
                        <label className="label cursor-pointer gap-2 p-0">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-sm checkbox-info"
                                checked={state.alertEnabled}
                                onChange={e => onChange({ alertEnabled: e.target.checked })}
                                disabled={disabled || !state.enabled}
                            />
                            <span className="label-text text-base-content">Alert at</span>
                        </label>
                        <input
                            type="number"
                            className="input input-sm w-20"
                            value={state.alert}
                            onChange={e => onChange({ alert: parseInt(e.target.value) || 0 })}
                            disabled={disabled || !state.enabled || !state.alertEnabled}
                            min={0}
                            max={180}
                        />
                        <span className="label-text text-base-content">minutes</span>
                    </div>
                </div>
            </div>
        </CollapsibleSection>
    );
}