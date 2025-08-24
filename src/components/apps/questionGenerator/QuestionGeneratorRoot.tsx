import { createHashRouter, RouterProvider, useBlocker, Outlet } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { AuthManager } from '../../../types/AuthManager';
import { getOptionalPermissionCheckAlert } from '../../auth/PermissionCheckAlert';
import { useEffect } from 'react';
import { sharedDirtyWindowState } from '../../../utils/SharedState';
import ConfirmationDialog from '../../ConfirmationDialog';
import MainPage from './MainPage';
import GeneratePage from './GeneratePage';

interface Props {
    loadingElementId: string;
}

function RootLayout({ loadingElementId }: Props) {
    const authManager = AuthManager.useNanoStore();

    // Subscribe to dirty state
    useStore(sharedDirtyWindowState);
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) => {
            return sharedDirtyWindowState.get() && currentLocation.pathname !== nextLocation.pathname;
        }
    );

    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) fallback.style.display = "none";
    }, [loadingElementId]);

    const permissionAlert = getOptionalPermissionCheckAlert(authManager);

    if (permissionAlert) {
        return permissionAlert;
    }

    return (
        <>
            {blocker.state === "blocked" && (
                <ConfirmationDialog
                    title="Unsaved Changes"
                    yesLabel="Leave Page"
                    onYes={() => {
                        sharedDirtyWindowState.set(false);
                        blocker.proceed();
                    }}
                    noLabel="Stay on Page"
                    onNo={() => blocker.reset()}
                    className="sm:w-full lg:w-1/2"
                >
                    You have unsaved changes on this page. Are you sure you want to leave?
                </ConfirmationDialog>)}
            <Outlet />
        </>);
}

const router = createHashRouter([
    {
        path: "/",
        element: <RootLayout loadingElementId="generator-fallback" />,
        children: [
            {
                path: ":setId?",
                element: <MainPage key="main-page" />
            },
            {
                path: "generate/:setId",
                element: <GeneratePage />
            }
        ]
    }
]);

export default function QuestionGeneratorRoot({ }: Props) {
    return <RouterProvider router={router} />;
}