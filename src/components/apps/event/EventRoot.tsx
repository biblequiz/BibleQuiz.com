import { createHashRouter, RouterProvider, useBlocker, Outlet, useNavigate, useMatches, type UIMatch, useParams, type Params, type NavigateFunction, useLocation } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import { sharedDirtyWindowState } from 'utils/SharedState';
import ConfirmationDialog from '../../ConfirmationDialog';
import ProtectedRoute from '../../auth/ProtectedRoute';
import { reactSidebarEntries, type ReactSidebarEntry, type ReactSidebarGroup, type ReactSidebarLink, type ReactSidebarManifest } from 'components/sidebar/ReactSidebar';
import RegistrationPage, { RegistrationPageSection, registrationPageSection } from './RegistrationPage';
import PermissionsPage from './PermissionsPage';
import ReportsPage from './ReportsPage';
import ScoringGeneralPage from './ScoringGeneralPage';
import ErrorPage from '../ErrorPage';
import NotFoundError from 'components/NotFoundError';
import ScoringAllDatabasesPage from './ScoringAllDatabasesPage';

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
        reactSidebarEntries.set(buildSidebar(routeMatches, routeParameters, navigate));
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

function buildSidebar(
    routeMatches: UIMatch<unknown, unknown>[],
    routeParameters: Readonly<Params<string>>,
    navigate: NavigateFunction): ReactSidebarEntry[] {

    if (routeParameters["*"]) {
        return [];
    }

    const eventId = routeParameters.eventId as string;
    const rootPath = eventId ? `/${eventId}` : "/";
    const registrationGroup: ReactSidebarGroup = {
        type: 'group' as const,
        label: "Registration",
        icon: "fas faUserPen",
        entries: [
            {
                type: 'link' as const,
                label: "General",
                navigate: () => {
                    if (!registrationPageSection.get()) {
                        navigate(rootPath);
                    }

                    registrationPageSection.set(RegistrationPageSection.General);
                },
                isCurrent: false,
                icon: "fas faCalendar"
            },
            {
                type: 'link' as const,
                label: "Eligibility & Rules",
                navigate: () => {
                    if (!registrationPageSection.get()) {
                        navigate(rootPath);
                    }

                    registrationPageSection.set(RegistrationPageSection.Eligibility);
                },
                isCurrent: false,
                icon: "fas faBook"
            },
            {
                type: 'link' as const,
                label: "Fields",
                navigate: () => {
                    if (!registrationPageSection.get()) {
                        navigate(rootPath);
                    }

                    registrationPageSection.set(RegistrationPageSection.Fields);
                },
                isCurrent: false,
                icon: "fas faBars"
            },
            {
                type: 'link' as const,
                label: "Divisions",
                navigate: () => {
                    if (!registrationPageSection.get()) {
                        navigate(rootPath);
                    }

                    registrationPageSection.set(RegistrationPageSection.Divisions);
                },
                isCurrent: false,
                icon: "fas faLayerGroup"
            },
            {
                type: 'link' as const,
                label: "Forms",
                navigate: () => {
                    if (!registrationPageSection.get()) {
                        navigate(rootPath);
                    }

                    registrationPageSection.set(RegistrationPageSection.Forms);
                },
                isCurrent: false,
                icon: "fas faGavel"
            },
            {
                type: 'link' as const,
                label: "Money",
                navigate: () => {
                    if (!registrationPageSection.get()) {
                        navigate(rootPath);
                    }

                    registrationPageSection.set(RegistrationPageSection.Money);
                },
                isCurrent: false,
                icon: "fas faDollarSign"
            },
            {
                type: 'link' as const,
                label: "Other",
                navigate: () => {
                    if (!registrationPageSection.get()) {
                        navigate(rootPath);
                    }

                    registrationPageSection.set(RegistrationPageSection.Other);
                },
                isCurrent: false,
                icon: "fas faEllipsis"
            }
        ],
        collapsed: true
    };

    const entries = !eventId
        ? [registrationGroup]
        : [
            registrationGroup,
            {
                type: 'group' as const,
                label: "Scoring",
                icon: "fas faChartLine",
                collapsed: true,
                entries: [
                    {
                        type: 'link' as const,
                        label: "General",
                        navigate: () => navigate(`${rootPath}/scoring`),
                        isCurrent: false,
                        icon: "fas faChartLine"
                    },
                    {
                        type: 'link' as const,
                        label: "Databases",
                        navigate: () => navigate(`${rootPath}/scoring/databases`),
                        isCurrent: false,
                        icon: "fas faDatabase"
                    },
                ]
            },
            {
                type: 'link' as const,
                label: "Downloads & Reports",
                navigate: () => navigate(`${rootPath}/reports`),
                isCurrent: false,
                icon: "fas faFileImport"
            },
            {
                type: 'link' as const,
                label: "Permissions",
                navigate: () => navigate(`${rootPath}/permissions`),
                isCurrent: false,
                icon: "fas faLock"
            }
        ];

    // Determine the current page.
    const segmentIndexes = routeMatches[routeMatches.length - 1].id.substring(4).split("-");
    let currentPage: any = { entries: entries };
    for (const segment of segmentIndexes) {
        currentPage = currentPage.entries[parseInt(segment)];
    }

    if (currentPage.type === "group") {
        if (currentPage === registrationGroup) {
            const sectionIndex: number = registrationPageSection.get();
            (registrationGroup.entries[sectionIndex] as ReactSidebarLink).isCurrent = true;
        }
        else {
            while (currentPage?.type === "group") {
                currentPage = (currentPage as ReactSidebarGroup).entries[0];
            }
        }
    }

    if (currentPage.type === "link") {
        (currentPage as ReactSidebarLink).isCurrent = true;
    }

    return entries;
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
                        path: "/:eventId/scoring",
                        element: <ScoringGeneralPage key="scoring-general-page" />
                    },
                    {
                        path: "/:eventId/scoring/databases",
                        element: <ScoringAllDatabasesPage key="scoring-databases-page" />
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

export default function EventRoot() {
    return <RouterProvider router={router} />;
}