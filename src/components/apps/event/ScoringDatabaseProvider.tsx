import FontAwesomeIcon from "components/FontAwesomeIcon";
import { use, useRef } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { AuthManager } from "types/AuthManager";

interface Props {
}

export interface ScoringDatabaseProviderContext {
    auth: AuthManager;
    rootUrl: string;
    databaseId: string | null;
    breadcrumbRef: React.RefObject<HTMLLIElement>;
}

export default function ScoringDatabaseProvider({ }: Props) {
    const auth = AuthManager.useNanoStore();
    const navigate = useNavigate();

    const urlParameters = useParams();
    const eventId = urlParameters.eventId || null;
    if (!eventId) {
        return null;
    }

    const databaseId = urlParameters.databaseId || null;
    const rootUrl = `/${eventId}/scoring/databases/${databaseId || ""}`;

    return (
        <>
            <div className="breadcrumbs mb-0">
                <ul>
                    <li className="mt-0 mr-0 pr-0">
                        <a className="cursor-pointer" onClick={() => navigate(rootUrl)}>
                            <FontAwesomeIcon icon="fas faHome" classNames={["fa-fw"]} />
                            <span>Databases</span>
                        </a>
                    </li>
                    <li className="mt-0 text-sm">
                        Page Name
                    </li>
                </ul>
            </div>
            <div className="divider mt-0" />
            <div>
                <b>Scoring Database Page</b>
            </div>
            <div>
                Temp Page Links:
                <a className="cursor-pointer" onClick={() => navigate(`${rootUrl}`)}>Meets</a>
                <a className="cursor-pointer" onClick={() => navigate(`${rootUrl}/teamsAndQuizzers`)}>Teams & Quizzers</a>
                <a className="cursor-pointer" onClick={() => navigate(`${rootUrl}/liveScores`)}>Live Scores</a>
                <a className="cursor-pointer" onClick={() => navigate(`${rootUrl}/playoffs`)}>Playoffs</a>
                <a className="cursor-pointer" onClick={() => navigate(`${rootUrl}/awards`)}>Awards</a>
                <a className="cursor-pointer" onClick={() => navigate(`${rootUrl}/manualEntry`)}>Manual Entry</a>
            </div>
            <Outlet context={{
                auth: auth,
                rootUrl: rootUrl,
                databaseId: databaseId,
            } as ScoringDatabaseProviderContext} />
        </>);
}