import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthManager } from '../../../types/AuthManager';
import { getOptionalPermissionCheckAlert } from '../../auth/PermissionCheckAlert';
import { useEffect, useState } from 'react';
import PreviousSetsPage from './PreviousSetsPage';
import GenerateSetPage from './GenerateSetPage';
import FontAwesomeIcon from '../../FontAwesomeIcon';
import { QuestionGeneratorService, type PreviouslyGeneratedSet } from '../../../types/services/QuestionGeneratorService';

interface Props {
    loadingElementId: string;
}

export const ROUTE_PREVIOUS_SET = "/";
export const ROUTE_GENERATE_SET = "/generate";

export default function QuestionGeneratorRoot({ loadingElementId }: Props) {

    const authManager = AuthManager.useNanoStore();
    const permissionAlert = getOptionalPermissionCheckAlert(authManager);

    const [previousSets, setPreviousSets] = useState<PreviouslyGeneratedSet[] | null>(null);
    const [retrieveError, setRetrieveError] = useState<string | null>(null);
    const [hasAutoRedirected, setHasAutoRedirected] = useState<boolean>(false);

    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) fallback.style.display = "none";
    }, [loadingElementId]);

    useEffect(
        () => {
            if (!previousSets) {
                QuestionGeneratorService.getPreviousSets(authManager)
                    .then(setPreviousSets)
                    .catch(error => {
                        setRetrieveError(error.message);
                    });
            }
        }, [authManager]);

    if (permissionAlert) {
        return permissionAlert;
    }

    return (
        <>
            <HashRouter>
                <nav>
                    <ul className="menu bg-base-200 lg:menu-horizontal rounded-box">
                        <NavLinkItem icon="fas faClockRotateLeft" title="Previously Generated Sets" pathName={ROUTE_PREVIOUS_SET} />
                        <NavLinkItem icon="fas faFileCirclePlus" title="Generate New Set" pathName={ROUTE_GENERATE_SET} />
                    </ul>
                </nav>
                <Routes>
                    <Route path={ROUTE_PREVIOUS_SET} element={
                        <PreviousSetsPage
                            previousSets={previousSets}
                            setPreviousSets={setPreviousSets}
                            retrieveError={retrieveError}
                            hasAutoRedirected={hasAutoRedirected}
                            setAutoRedirected={setHasAutoRedirected}
                        />}
                    />
                    <Route path={ROUTE_GENERATE_SET} element={<GenerateSetPage />} />
                </Routes>
            </HashRouter>
        </>);
}

interface NavLinkItemProps {
    icon: string;
    title: string;
    pathName: string;
}

function NavLinkItem({ icon, title, pathName }: NavLinkItemProps) {

    const content = (
        <>
            <FontAwesomeIcon icon={icon} />
            <span>{title}</span>
        </>);

    const isCurrentPage = location.pathname === pathName;

    return (
        <li className="mt-0">
            {isCurrentPage ? (
                content
            ) : (
                <Link to={pathName}>
                    {content}
                </Link>
            )}
        </li>
    );
}