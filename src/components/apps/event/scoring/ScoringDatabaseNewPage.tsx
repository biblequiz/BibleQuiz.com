import DatabaseSettingsSection from "./DatabaseSettingsSection";
import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import { useNavigate, useOutletContext } from "react-router-dom";

interface Props {
}

export default function ScoringDatabaseNewPage({ }: Props) {
    const { auth, eventId, rootUrl } = useOutletContext<ScoringDatabaseProviderContext>();
    const navigate = useNavigate();

    return (
        <DatabaseSettingsSection
            auth={auth}
            eventId={eventId}
            onSaved={summary => navigate(`${rootUrl}/${summary.SummaryAndSettings.DatabaseId}`)}
        />);
}