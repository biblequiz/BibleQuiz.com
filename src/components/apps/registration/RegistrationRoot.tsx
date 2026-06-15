import { useEffect } from 'react';
import { createHashRouter, RouterProvider, Outlet, useBlocker } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { sharedDirtyWindowState } from 'utils/SharedState';
import ConfirmationDialog from 'components/ConfirmationDialog';
import ProtectedRoute from 'components/auth/ProtectedRoute';
import ErrorPage from 'components/apps/ErrorPage';
import RegistrationProvider from './RegistrationProvider';
import RegistrationPage from './RegistrationPage';
import RegistrationReceiptPage from './RegistrationReceiptPage';

interface Props {
    loadingElementId: string;
}

function RootLayout({ loadingElementId }: Props) {

    // Hide the Astro-provided loading fallback once React has mounted.
    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) fallback.style.display = "none";
    }, [loadingElementId]);

    // Block in-app navigation if the user has unsaved changes.
    useStore(sharedDirtyWindowState);
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) => {
            return sharedDirtyWindowState.get() && currentLocation.pathname !== nextLocation.pathname;
        }
    );

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
        element: <RootLayout loadingElementId="registration-fallback" />,
        errorElement: <ErrorPage loadingElementId="registration-fallback" />,
        children: [
            {
                path: "/",
                element: <ProtectedRoute />,
                children: [
                    {
                        path: "/",
                        element: <RegistrationProvider />,
                        children: [
                            {
                                path: "/:eventId",
                                element: <RegistrationPage />
                            },
                            {
                                path: "/:eventId/:churchId",
                                element: <RegistrationPage />
                            },
                            {
                                path: "/:eventId/:churchId/Receipt",
                                element: <RegistrationReceiptPage />
                            },
                        ]
                    }
                ]
            }
        ]
    }
]);

export default function RegistrationRoot() {
    return <RouterProvider router={router} />;
}