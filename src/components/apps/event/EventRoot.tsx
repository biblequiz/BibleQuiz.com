import { createHashRouter, RouterProvider, useBlocker, Outlet, useNavigate, useMatches, type UIMatch, useParams, type Params, type NavigateFunction, useLocation } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import { sharedDirtyWindowState } from 'utils/SharedState';
import ConfirmationDialog from '../../ConfirmationDialog';
import ProtectedRoute from '../../auth/ProtectedRoute';
import { reactSidebarManifest, type ReactSidebarEntry, type ReactSidebarGroup, type ReactSidebarLink, type ReactSidebarManifest } from 'components/sidebar/ReactSidebar';
import RegistrationPage from './RegistrationPage';
import PermissionsPage from './PermissionsPage';
import ReportsPage from './ReportsPage';
import ScoringPage from './ScoringPage';
import MoneyPage from './MoneyPage';
import ErrorPage from '../ErrorPage';
import NotFoundError from 'components/NotFoundError';

interface Props {
    loadingElementId: string;
}

function RootLayout({ loadingElementId }: Props) {

    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) fallback.style.display = "none";
    }, [loadingElementId]);

    // Subscribe to dirty state
    useStore(sharedDirtyWindowState);
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) => {
            return sharedDirtyWindowState.get() && currentLocation.pathname !== nextLocation.pathname;
        }
    );

    // Configure the routing.
    const routeMatches: UIMatch<unknown, unknown>[] = useMatches();
    const routeParameters: Readonly<Params<string>> = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        reactSidebarManifest.set(buildSidebar(routeMatches, routeParameters, navigate));
    }, [location.pathname]);

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
        errorElement: <ErrorPage loadingElementId="event-fallback" />,
        children: [
            {
                path: "/",
                element: <ProtectedRoute />,
                children: [
                    {
                        path: "/:eventId?",
                        element: <RegistrationPage key="registration-page" />
                    },
                    {
                        path: "/:eventId/money",
                        element: <MoneyPage key="money-page" />
                    },
                    {
                        path: "/:eventId/scoring",
                        element: <ScoringPage key="scoring-page" />
                    },
                    {
                        path: "/:eventId/reports",
                        element: <ReportsPage key="reports-page" />
                    },
                    {
                        path: "/:eventId/permissions",
                        element: <PermissionsPage key="permissions-page" />
                    },
                ]
            },
            {
                path: "*",
                element: <NotFoundError key="notfound-page" />
            },
        ]
    }
]);

function buildSidebar(
    routeMatches: UIMatch<unknown, unknown>[],
    routeParameters: Readonly<Params<string>>,
    navigate: NavigateFunction): ReactSidebarManifest {

    if (routeParameters["*"]) {
        return { entries: [], navigate: navigate };
    }

    const eventId = routeParameters.eventId as string;
    if (!eventId) {
        return {
            entries: [
                {
                    type: 'link' as const,
                    label: "Registration",
                    href: "/",
                    isCurrent: true,
                    attrs: {
                        icon: "fas faPeopleArrows"
                    }
                }
            ],
            navigate: navigate
        };
    }

    const rootPath = `/${eventId}`;
    const entries: ReactSidebarEntry[] = [
        {
            type: 'link' as const,
            label: "Registration",
            href: rootPath,
            isCurrent: false,
            attrs: {
                icon: "fas faPeopleArrows"
            }
        },
        {
            type: 'link' as const,
            label: "Money",
            href: `${rootPath}/money`,
            isCurrent: false,
            attrs: {
                icon: "fas faDollarSign"
            }
        },
        {
            type: 'link' as const,
            label: "Scoring",
            href: `${rootPath}/scoring`,
            isCurrent: false,
            attrs: {
                icon: "fas faChartLine"
            }
        },
        {
            type: 'link' as const,
            label: "Downloads & Reports",
            href: `${rootPath}/reports`,
            isCurrent: false,
            attrs: {
                icon: "fas faFileImport"
            }
        },
        {
            type: 'link' as const,
            label: "Permissions",
            href: `${rootPath}/permissions`,
            isCurrent: false,
            attrs: {
                icon: "fas faLock"
            }
        }
    ];

    // Determine the current page.
    const segmentIndexes = routeMatches[routeMatches.length - 1].id.substring(4).split("-");
    let currentPage: any = { entries: entries };
    for (const segment of segmentIndexes) {
        currentPage = currentPage.entries[parseInt(segment)];
    }

    if (currentPage.type === "group") {
        while (currentPage?.type === "group") {
            currentPage = (currentPage as ReactSidebarGroup).entries[0];
        }
    }

    if (currentPage.type === "link") {
        (currentPage as ReactSidebarLink).isCurrent = true;
    }

    return {
        entries: entries,
        navigate: navigate
    } as ReactSidebarManifest;
}

export default function EventRoot() {
    return <RouterProvider router={router} />;
}