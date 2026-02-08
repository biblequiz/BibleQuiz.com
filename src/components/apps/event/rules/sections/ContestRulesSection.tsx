import CollapsibleSection from "components/CollapsibleSection";
import type { ContestRulesState } from "../hooks/useMatchRulesForm";
import CheckboxNumberInput from "../inputs/CheckboxNumberInput";

interface Props {
    state: ContestRulesState;
    onChange: (updates: Partial<ContestRulesState>) => void;
    disabled?: boolean;
}

export default function ContestRulesSection({ state, onChange, disabled = false }: Props) {
    const contestLabelLower = state.contestLabel.toLowerCase();

    return (
        <CollapsibleSection
            pageId="matchRulesEditor"
            elementId="contests"
            icon="fas faGavel"
            title="Contests"
            titleClass="mt-4"
            allowMultipleOpen={true}
        >
            <div className="p-2 space-y-4">
                <div className="form-control w-full max-w-xs">
                    <label className="label">
                        <span className="label-text font-medium">Plural Label</span>
                    </label>
                    <input
                        type="text"
                        className="input w-full"
                        value={state.contestLabel}
                        onChange={e => onChange({ contestLabel: e.target.value })}
                        disabled={disabled}
                        maxLength={40}
                        placeholder="e.g., Contests, Coach's Appeals"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-0">
                    <CheckboxNumberInput
                        checkboxLabel="Allow up to"
                        suffixLabel={`successful ${contestLabelLower}`}
                        checked={state.maxSuccessfulEnabled}
                        value={state.maxSuccessful}
                        onCheckedChange={checked => onChange({ maxSuccessfulEnabled: checked })}
                        onValueChange={value => onChange({ maxSuccessful: value })}
                        disabled={disabled}
                    />
                    <CheckboxNumberInput
                        checkboxLabel="and up to"
                        suffixLabel={`unsuccessful ${contestLabelLower}`}
                        checked={state.maxUnsuccessfulEnabled}
                        value={state.maxUnsuccessful}
                        onCheckedChange={checked => onChange({ maxUnsuccessfulEnabled: checked })}
                        onValueChange={value => onChange({ maxUnsuccessful: value })}
                        disabled={disabled}
                    />
                    <CheckboxNumberInput
                        checkboxLabel="Award foul after"
                        suffixLabel={`unsuccessful ${contestLabelLower}`}
                        checked={state.unsuccessfulFoulsEnabled}
                        value={state.unsuccessfulFouls}
                        onCheckedChange={checked => onChange({ unsuccessfulFoulsEnabled: checked })}
                        onValueChange={value => onChange({ unsuccessfulFouls: value })}
                        disabled={disabled}
                    />
                </div>
            </div>
        </CollapsibleSection>
    );
}