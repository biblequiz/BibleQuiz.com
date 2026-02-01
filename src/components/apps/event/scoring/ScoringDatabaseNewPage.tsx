import { useState } from "react";
import DatabaseSettingsSection from "./DatabaseSettingsSection";
import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import { useNavigate, useOutletContext } from "react-router-dom";

interface Props {
}

export default function ScoringDatabaseNewPage({ }: Props) {

    const { auth, eventId, rootUrl } = useOutletContext<ScoringDatabaseProviderContext>();
    const navigate = useNavigate();

    const [useClone, setUseClone] = useState<boolean>(false);

    return (
        <div className="space-y-6 mt-4">
            <h5 className="mb-2">How do you want to create the database?</h5>
            <div className="w-full mb-2">
                <label className="label text-wrap">
                    <input
                        type="radio"
                        name="feeType"
                        className="radio radio-info"
                        checked={!useClone}
                        onChange={e => setUseClone(!e.target.checked)}
                    />
                    <span className="text-sm">
                        <b>Start Fresh</b><br />
                        Start with a brand new database.
                    </span>
                </label>
            </div>
            <div className="w-full mb-2">
                <label className="label text-wrap">
                    <input
                        type="radio"
                        name="feeType"
                        className="radio radio-info"
                        checked={useClone}
                        onChange={e => setUseClone(e.target.checked)}
                    />
                    <span className="text-sm">
                        <b>Copy Existing Database</b><br />
                        Start with a copy of an existing database. This can be helpful if you plan on creating 
                        a season report as the teams will be considered the same across events.
                    </span>
                </label>
            </div>
            <div className="divider" />
            <DatabaseSettingsSection
                auth={auth}
                eventId={eventId}
                onSaved={summary => navigate(`${rootUrl}/${summary.Settings.DatabaseId}`)}
            />
        </div>);
}