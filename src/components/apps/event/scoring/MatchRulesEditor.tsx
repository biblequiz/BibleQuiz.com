import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import { useNavigate, useOutletContext } from "react-router-dom";
import DatabaseSettingsSection from "./DatabaseSettingsSection";
import type { CompetitionType, MatchRules } from "types/MatchRules";

interface Props {
    rules: MatchRules;
    defaultType: CompetitionType;
    defaultRules: MatchRules;
    onChange: (newRules: MatchRules) => void;
}

export default function MatchRulesEditor({ 
    rules,
    defaultType,
    defaultRules,
    onChange
}: Props) {

    // TODO: Implement this.
    return null;
}