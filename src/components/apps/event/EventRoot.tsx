import { createHashRouter, RouterProvider, useBlocker, Outlet } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import { sharedDirtyWindowState } from 'utils/SharedState';
import ConfirmationDialog from '../../ConfirmationDialog';
import ProtectedRoute from '../../auth/ProtectedRoute';
import MainPage from './MainPage';
import ReactSidebarEntry, { reactSidebarEntries, type ReactSidebarLink } from 'components/sidebar/ReactSidebar';

interface Props {
    loadingElementId: string;
}

function RootLayout({ loadingElementId }: Props) {

    // Subscribe to dirty state
    useStore(sharedDirtyWindowState);
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) => {
            return sharedDirtyWindowState.get() && currentLocation.pathname !== nextLocation.pathname;
        }
    );

    const sidebar = useStore(reactSidebarEntries);
    useEffect(() => {
        if (!sidebar || sidebar.length === 0) {
            reactSidebarEntries.set([ 
                { type: 'link', label: "foo", href: "/manage-event/#foo", isCurrent: false, attrs: {} } as ReactSidebarLink
            ]);
        }
    }, [sidebar]);

    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) fallback.style.display = "none";
    }, [loadingElementId]);

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
        element: <RootLayout loadingElementId="event-fallback" />,
        children: [
            {
                path: "/",
                element: <ProtectedRoute />,
                children: [
                    {
                        path: "",
                        element: <MainPage key="main-page" />
                    }
                ]
            }
        ]
    }
]);

export default function EventRoot() {
    return <RouterProvider router={router} />;
}