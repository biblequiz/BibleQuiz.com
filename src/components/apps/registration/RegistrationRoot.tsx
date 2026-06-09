import { useEffect } from 'react';
import { createHashRouter, RouterProvider, Outlet, useBlocker, useOutletContext } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { sharedDirtyWindowState } from 'utils/SharedState';
import ConfirmationDialog from 'components/ConfirmationDialog';
import ProtectedRoute from 'components/auth/ProtectedRoute';
import ErrorPage from 'components/apps/ErrorPage';
import RegistrationProvider, { type RegistrationProviderContext } from './RegistrationProvider';

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

/**
 * Temporary placeholder rendered inside the `RegistrationProvider` outlet.
 *
 * TODO: Replace with the real `RegistrationPage` component (see the deleted
 * `src/components/apps/registration/README.md` for the originally-planned
 * `RegistrationPage` + `TeamRegistrationDialog` components that still need
 * to be authored).
 */
function RegistrationPagePlaceholder() {
    const context = useOutletContext<RegistrationProviderContext>();
    return (
        <div className="hero bg-base-300 rounded-2xl shadow-lg">
            <div className="hero-content text-center py-16 px-8">
                <div className="max-w-4xl">
                    <h1 className="text-3xl font-bold text-base-content mb-4">
                        Registration UI Coming Soon
                    </h1>
                    <p className="text-lg text-base-content/70 mb-2">
                        Event: <b>{context.event.Name}</b>
                    </p>
                    {context.church && (
                        <p className="text-lg text-base-content/70 mb-2">
                            Church: <b>{context.church.Name}</b>
                        </p>)}
                    <p className="text-sm text-base-content/50 mt-4">
                        The full registration page (church picker, team / quizzer /
                        official / attendee cards, and receipt) has not yet been
                        wired up.
                    </p>
                </div>
            </div>
        </div>);
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
                                element: <RegistrationPagePlaceholder />
                            },
                            {
                                path: "/:eventId/:churchId",
                                element: <RegistrationPagePlaceholder />
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