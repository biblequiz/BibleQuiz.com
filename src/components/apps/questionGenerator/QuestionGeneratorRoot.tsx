import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthManager } from '../../../types/AuthManager';
import { getOptionalPermissionCheckAlert } from '../../auth/PermissionCheckAlert';
import { useEffect, useRef, useState } from 'react';
import PreviousSetsPage from './PreviousSetsPage';
import GenerateSetPage from './GenerateSetPage';
import { QuestionGeneratorService, type PreviouslyGeneratedSet } from '../../../types/services/QuestionGeneratorService';

interface Props {
    loadingElementId: string;
}

export default function QuestionGeneratorRoot({ loadingElementId }: Props) {

    const authManager = AuthManager.useNanoStore();

    const generateSetElement = useRef<HTMLDivElement>(null);

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
                <Route path="/:setId?" element={
                    <>
                        <PreviousSetsPage
                            generateSetElement={generateSetElement}
                        />
                        <div className="divider" />
                        <GenerateSetPage
                            generateSetElement={generateSetElement}
                        />
                    </>}
                />
                <Route path="/generate/:setId" element={
                    <>
                        <span>Generate</span>
                    </>}
                />
            </Routes>
        </HashRouter>);
}