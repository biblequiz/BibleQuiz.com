import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthManager } from '../../../types/AuthManager';
import { getOptionalPermissionCheckAlert } from '../../auth/PermissionCheckAlert';
import { useEffect } from 'react';
import PreviousSetsPage from './PreviousSetsPage';
import GenerateSetPage from './GenerateSetPage';
import FontAwesomeIcon from '../../FontAwesomeIcon';

interface Props {
    loadingElementId: string;
}

export const ROUTE_PREVIOUS_SET = "/";
export const ROUTE_GENERATE_SET = "/generate";

export default function QuestionGeneratorRoot({ loadingElementId }: Props) {

    const authManager = AuthManager.useNanoStore();
    const permissionAlert = getOptionalPermissionCheckAlert(authManager);

    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) fallback.style.display = "none";
    }, [loadingElementId]);

    if (permissionAlert) {
        return permissionAlert;
    }

    return (
        <HashRouter>
            <nav className="breadcrumbs">
                <ul>
                    <NavLinkItem icon="fas faClockRotateLeft" title="Previous Sets" pathName={ROUTE_PREVIOUS_SET} />
                    <NavLinkItem icon="fas faFileCirclePlus" title="Generate New Set" pathName={ROUTE_GENERATE_SET} />
                </ul>
            </nav>
            <Routes>
                <Route path={ROUTE_PREVIOUS_SET} element={<PreviousSetsPage />} />
                <Route path={ROUTE_GENERATE_SET} element={<GenerateSetPage />} />
            </Routes>
        </HashRouter>
    );
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