import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthManager } from '../../../types/AuthManager';
import { getOptionalPermissionCheckAlert } from '../../auth/PermissionCheckAlert';
import { useEffect, useState } from 'react';
import PreviousSetsPage from './PreviousSetsPage';
import GenerateSetPage from './GenerateSetPage';
import { QuestionGeneratorService, type PreviouslyGeneratedSet } from '../../../types/services/QuestionGeneratorService';

interface Props {
    loadingElementId: string;
}

export const ROUTE_SET_SELECTION = "/";
const GENERATE_SET_ELEMENT_ID = "new-set-page";

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
            <Routes>
                <Route path={ROUTE_SET_SELECTION} element={
                    <>
                        <PreviousSetsPage
                            generateSetElementId={GENERATE_SET_ELEMENT_ID}
                        />
                        <div className="divider" />
                        <GenerateSetPage
                            elementId={GENERATE_SET_ELEMENT_ID}
                        />
                    </>}
                />
            </Routes>
        </HashRouter>);
}