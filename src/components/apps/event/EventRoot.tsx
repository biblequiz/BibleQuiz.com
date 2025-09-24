import { createHashRouter, RouterProvider, useBlocker, Outlet, useNavigate, useMatches, type UIMatch, useParams, type Params, type NavigateFunction, useLocation } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import { sharedDirtyWindowState } from 'utils/SharedState';
import ConfirmationDialog from '../../ConfirmationDialog';
import ProtectedRoute from '../../auth/ProtectedRoute';
import { reactSidebarEntries, type ReactSidebarEntry, type ReactSidebarGroup, type ReactSidebarLink } from 'components/sidebar/ReactSidebar';
import PermissionsPage from './PermissionsPage';
import ReportsPage from './ReportsPage';
import ErrorPage from '../ErrorPage';
import NotFoundError from 'components/NotFoundError';
import RegistrationProvider from './RegistrationProvider';
import RegistrationGeneralPage from './RegistrationGeneralPage';
import RegistrationEligibilityPage from './RegistrationEligibilityPage';
import RegistrationFieldsPage from './RegistrationFieldsPage';
import RegistrationDivisionsPage from './RegistrationDivisionsPage';
import RegistrationFormsPage from './RegistrationFormsPage';
import RegistrationMoneyPage from './RegistrationMoneyPage';
import RegistrationOtherPage from './RegistrationMoneyPage';
import ScoringSettingsPage from './ScoringSettingsPage';
import ScoringDatabaseProvider from './ScoringDatabaseProvider';
import ScoringDatabaseMeetsPage from './ScoringDatabaseMeetsPage';
import ScoringDatabaseLiveScoresPage from './ScoringDatabaseLiveScoresPage';
import ScoringDatabasePlayoffsPage from './ScoringDatabasePlayoffsPage';
import ScoringDatabaseTeamsAndQuizzersPage from './ScoringDatabaseTeamsAndQuizzersPage';
import ScoringDatabaseAwardsPage from './ScoringDatabaseAwardsPage';
import ScoringDatabaseManualEntryPage from './ScoringDatabaseManualEntryPage';

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
    const rootPath = eventId ? `/${eventId}` : "";
    const registrationGroup: ReactSidebarGroup = {
        type: 'group' as const,
        label: "Registration",
        icon: "fas faUserPen",
        entries: [
            {
                type: 'link' as const,
                label: "General",
                navigate: () => navigate(rootPath),
                isCurrent: false,
                icon: "fas faCalendar"
            },
            {
                type: 'link' as const,
                label: "Eligibility & Rules",
                navigate: () => navigate(`${rootPath}/registration/eligibility`),
                isCurrent: false,
                icon: "fas faBook"
            },
            {
                type: 'link' as const,
                label: "Fields",
                navigate: () => navigate(`${rootPath}/registration/fields`),
                isCurrent: false,
                icon: "fas faBars"
            },
            {
                type: 'link' as const,
                label: "Divisions",
                navigate: () => navigate(`${rootPath}/registration/divisions`),
                isCurrent: false,
                icon: "fas faLayerGroup"
            },
            {
                type: 'link' as const,
                label: "Forms",
                navigate: () => navigate(`${rootPath}/registration/forms`),
                isCurrent: false,
                icon: "fas faGavel"
            },
            {
                type: 'link' as const,
                label: "Money",
                navigate: () => navigate(`${rootPath}/registration/money`),
                isCurrent: false,
                icon: "fas faDollarSign"
            },
            {
                type: 'link' as const,
                label: "Other",
                navigate: () => navigate(`${rootPath}/registration/other`),
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
        if (!currentPage.entries) {
            break;
        }

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
                        element: <RegistrationProvider />,
                        children: [
                            {
                                path: "/:eventId?",
                                element: <RegistrationGeneralPage />
                            },
                            {
                                path: "/:eventId?/registration/eligibility",
                                element: <RegistrationEligibilityPage />
                            },
                            {
                                path: "/:eventId?/registration/fields",
                                element: <RegistrationFieldsPage />
                            },
                            {
                                path: "/:eventId?/registration/divisions",
                                element: <RegistrationDivisionsPage />
                            },
                            {
                                path: "/:eventId?/registration/forms",
                                element: <RegistrationFormsPage />
                            },
                            {
                                path: "/:eventId?/registration/money",
                                element: <RegistrationMoneyPage />
                            },
                            {
                                path: "/:eventId?/registration/other",
                                element: <RegistrationOtherPage />
                            },
                        ],
                    },
                    {
                        path: "/:eventId/scoring",
                        children: [
                            {
                                path: "/:eventId/scoring",
                                element: <ScoringSettingsPage />
                            },
                            {
                                path: "/:eventId/scoring/databases/:databaseId?",
                                element: <ScoringDatabaseProvider />,
                                children: [
                                    {
                                        path: "/:eventId/scoring/databases/:databaseId?",
                                        element: <ScoringDatabaseMeetsPage />
                                    },
                                    {
                                        path: "/:eventId/scoring/databases/:databaseId?/teamsAndQuizzers",
                                        element: <ScoringDatabaseTeamsAndQuizzersPage />
                                    },
                                    {
                                        path: "/:eventId/scoring/databases/:databaseId?/liveScores",
                                        element: <ScoringDatabaseLiveScoresPage />
                                    },
                                    {
                                        path: "/:eventId/scoring/databases/:databaseId?/playoffs",
                                        element: <ScoringDatabasePlayoffsPage />
                                    },
                                    {
                                        path: "/:eventId/scoring/databases/:databaseId?/awards",
                                        element: <ScoringDatabaseAwardsPage />
                                    },
                                    {
                                        path: "/:eventId/scoring/databases/:databaseId?/manualEntry",
                                        element: <ScoringDatabaseManualEntryPage />
                                    },
                                ]
                            },
                        ]
                    },
                    {
                        path: "/:eventId/reports",
                        element: <ReportsPage />
                    },
                    {
                        path: "/:eventId/permissions",
                        element: <PermissionsPage />
                    },
                ]
            },
            {
                path: "*",
                element: <NotFoundError />
            },
        ]
    }
]);

export default function EventRoot() {
    return <RouterProvider router={router} />;
}