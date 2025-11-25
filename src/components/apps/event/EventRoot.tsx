import { createHashRouter, RouterProvider, Outlet, useNavigate, useMatches, type UIMatch, useParams, type Params, type NavigateFunction, useLocation, useBlocker } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { BlockerCallbackResult, sharedDirtyWindowState, sharedRequireBlockerCallback } from 'utils/SharedState';
import ConfirmationDialog from '../../ConfirmationDialog';
import ProtectedRoute from '../../auth/ProtectedRoute';
import { reactSidebarEntries, type ReactSidebarEntry, type ReactSidebarGroup, type ReactSidebarLink } from 'components/sidebar/ReactSidebar';
import PermissionsPage from './PermissionsPage';
import ReportsPage from './ReportsPage';
import ErrorPage from '../ErrorPage';
import NotFoundError from 'components/NotFoundError';
import RegistrationProvider from './RegistrationProvider';
import RegistrationGeneralPage from './registration/RegistrationGeneralPage';
import RegistrationTeamsAndQuizzersPage from './registration/RegistrationTeamsAndQuizzersPage';
import RegistrationOfficialsPage from './registration/RegistrationOfficialsPage';
import RegistrationRequiredFieldsPage from './registration/RegistrationRequiredFieldsPage';
import RegistrationCustomFieldsPage from './registration/RegistrationCustomFieldsPage';
import RegistrationDivisionsPage from './registration/RegistrationDivisionsPage';
import RegistrationFormsPage from './registration/RegistrationFormsPage';
import RegistrationMoneyPage from './registration/RegistrationMoneyPage';
import RegistrationOtherPage from './registration/RegistrationOtherPage';
import ScoringSettingsPage from './ScoringSettingsPage';
import ScoringDatabaseProvider from './ScoringDatabaseProvider';
import ScoringDatabaseMeetsPage from './ScoringDatabaseMeetsPage';
import ScoringDatabaseLiveScoresPage from './ScoringDatabaseLiveScoresPage';
import ScoringDatabasePlayoffsPage from './ScoringDatabasePlayoffsPage';
import ScoringDatabaseTeamsAndQuizzersPage from './ScoringDatabaseTeamsAndQuizzersPage';
import ScoringDatabaseAwardsPage from './ScoringDatabaseAwardsPage';
import ScoringDatabaseManualEntryPage from './ScoringDatabaseManualEntryPage';
import EventProvider from './EventProvider';
import ScoringDatabaseNewPage from './ScoringDatabaseNewPage';
import ScoringDatabaseGeneralPage from './ScoringDatabaseGeneralPage';
import { AuthManager } from 'types/AuthManager';

interface Props {
    loadingElementId: string;
}

const SCORES_GROUP_ID = "scores";
const DATABASE_GROUP_ID_PREFIX = "db-";

function RootLayout({ loadingElementId }: Props) {

    const auth = AuthManager.useNanoStore();

    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) fallback.style.display = "none";
    }, [loadingElementId]);

    // Subscribe to dirty state
    const routeParameters: Readonly<Params<string>> = useParams();
    const [showPrompt, setShowPrompt] = useState(false);

    useStore(sharedDirtyWindowState);
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) => {
            if (sharedDirtyWindowState.get() &&
                currentLocation.pathname !== nextLocation.pathname) {

                const callback = sharedRequireBlockerCallback.get();
                if (callback) {
                    const result = callback(nextLocation.pathname);
                    if (result === BlockerCallbackResult.Allow) {
                        sharedRequireBlockerCallback.set(null);
                        return false;
                    }

                    setShowPrompt(result === BlockerCallbackResult.ShowPrompt);
                    return true;
                }
                else {
                    setShowPrompt(true);
                    return true;
                }
            }

            sharedRequireBlockerCallback.set(null);
            return false;
        }
    );

    // Configure the routing.
    const routeMatches: UIMatch<unknown, unknown>[] = useMatches();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        reactSidebarEntries.set({
            showParent: auth.userProfile?.canCreateEvents ?? false,
            entries: buildSidebar(
                routeMatches,
                routeParameters,
                navigate)
        });
    }, [location.pathname, auth, blocker]);

    return (
        <>
            {blocker.state === "blocked" && showPrompt && (
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
    const rootEventPath = eventId ? `/${eventId}` : "";

    const segmentIndexes = routeMatches[routeMatches.length - 1].id.substring(6).split('-');
    const sidebarEntries: ReactSidebarEntry[] = [
        {
            type: 'link' as const,
            label: "All Events",
            navigate: () => navigate(""),
            isCurrent: false,
            icon: "fas faList"
        }];
    if (segmentIndexes.length > 1 || segmentIndexes[0] !== "0") {
        segmentIndexes[0] = "1";
    }
    else {
        (sidebarEntries[0] as ReactSidebarLink).isCurrent = true;
        return sidebarEntries;
    }

    sidebarEntries.push(
        {
            type: 'group' as const,
            label: "Registration",
            icon: "fas faUserPen",
            entries: [
                {
                    type: 'link' as const,
                    label: "General",
                    navigate: () => navigate(`${rootEventPath}/registration/general`),
                    isCurrent: false,
                    icon: "fas faCalendar"
                },
                {
                    type: 'link' as const,
                    label: "Teams & Quizzers",
                    navigate: () => navigate(`${rootEventPath}/registration/teamsAndQuizzers`),
                    isCurrent: false,
                    icon: "fas faUserGroup"
                },
                {
                    type: 'link' as const,
                    label: "Officials & Attendees",
                    navigate: () => navigate(`${rootEventPath}/registration/officials`),
                    isCurrent: false,
                    icon: "fas faHelmetSafety"
                },
                {
                    type: 'link' as const,
                    label: "Required Fields",
                    navigate: () => navigate(`${rootEventPath}/registration/requiredFields`),
                    isCurrent: false,
                    icon: "fas faUser"
                },
                {
                    type: 'link' as const,
                    label: "Custom Fields",
                    navigate: () => navigate(`${rootEventPath}/registration/customFields`),
                    isCurrent: false,
                    icon: "fas faBars"
                },
                {
                    type: 'link' as const,
                    label: "Divisions",
                    navigate: () => navigate(`${rootEventPath}/registration/divisions`),
                    isCurrent: false,
                    icon: "fas faLayerGroup"
                },
                {
                    type: 'link' as const,
                    label: "Forms",
                    navigate: () => navigate(`${rootEventPath}/registration/forms`),
                    isCurrent: false,
                    icon: "fas faGavel"
                },
                {
                    type: 'link' as const,
                    label: "Money",
                    navigate: () => navigate(`${rootEventPath}/registration/money`),
                    isCurrent: false,
                    icon: "fas faDollarSign"
                },
                {
                    type: 'link' as const,
                    label: "Other",
                    navigate: () => navigate(`${rootEventPath}/registration/other`),
                    isCurrent: false,
                    icon: "fas faEllipsis"
                }
            ],
            collapsed: true
        } as ReactSidebarGroup);

    if (eventId) {
        sidebarEntries.push(
            {
                type: 'group' as const,
                label: "Scoring",
                id: SCORES_GROUP_ID,
                collapsed: true,
                entries: [
                    {
                        type: 'link' as const,
                        label: "General",
                        navigate: () => navigate(`${rootEventPath}/scoring`),
                        isCurrent: false,
                        icon: "fas faChartLine"
                    },
                    {
                        type: 'group' as const,
                        label: "Databases",
                        collapsed: true,
                        entries: [
                            buildDatabaseEntry(rootEventPath, "db1", "Database 1", navigate),
                            buildDatabaseEntry(rootEventPath, "db2", "Database 2", navigate),
                            {
                                type: 'link' as const,
                                label: "Add Database",
                                navigate: () => navigate(`${rootEventPath}/scoring/addDatabase`),
                                isCurrent: false,
                                icon: "fas faPlus"
                            },
                        ]
                    }
                ]
            } as ReactSidebarGroup);

        sidebarEntries.push(
            {
                type: 'link' as const,
                label: "Downloads & Reports",
                navigate: () => navigate(`${rootEventPath}/reports`),
                isCurrent: false,
                icon: "fas faFileImport"
            } as ReactSidebarLink);

        sidebarEntries.push(
            {
                type: 'link' as const,
                label: "Permissions",
                navigate: () => navigate(`${rootEventPath}/permissions`),
                isCurrent: false,
                icon: "fas faLock"
            } as ReactSidebarLink);
    }

    // Determine the current page.
    const databaseId = routeParameters.databaseId;
    if (segmentIndexes.length > 1 && segmentIndexes[0] === "0") {
        // This adjust for the "All Events" item in the sidebar.
        segmentIndexes[0] = "1";
    }

    let currentPage: any = { entries: sidebarEntries };
    for (const segment of segmentIndexes) {
        if (!currentPage.entries) {
            break;
        }

        if (currentPage.id === SCORES_GROUP_ID) {

            if (segment === "0") {
                currentPage = currentPage.entries[0];
                break;
            }

            // Skip to the databases section.
            currentPage = currentPage.entries[1];

            if (routeParameters.databaseId) {
                // Find the matching database.
                const findId = DATABASE_GROUP_ID_PREFIX + databaseId;
                currentPage = currentPage.entries.find((e: ReactSidebarGroup) => e.id === findId);
                continue;
            }
            else {
                currentPage = currentPage.entries[2];
                break;
            }
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

    return sidebarEntries;
}

function buildDatabaseEntry(
    rootPath: string,
    databaseId: string,
    databaseName: string,
    navigate: (path: string) => void): ReactSidebarGroup {

    return {
        type: 'group' as const,
        label: databaseName,
        collapsed: true,
        icon: "fas faDatabase",
        id: DATABASE_GROUP_ID_PREFIX + databaseId,
        entries: [
            {
                type: 'link' as const,
                label: "General",
                navigate: () => navigate(`${rootPath}/scoring/databases/${databaseId}`),
                isCurrent: false,
                icon: "fas faHome"
            },
            {
                type: 'link' as const,
                label: "Divisions",
                navigate: () => navigate(`${rootPath}/scoring/databases/${databaseId}/meets`),
                isCurrent: false,
                icon: "fas faLayerGroup"
            },
            {
                type: 'link' as const,
                label: "Teams & Quizzers",
                navigate: () => navigate(`${rootPath}/scoring/databases/${databaseId}/teamsAndQuizzers`),
                isCurrent: false,
                icon: "fas faUserGroup"
            },
            {
                type: 'link' as const,
                label: "Live Scores",
                navigate: () => navigate(`${rootPath}/scoring/databases/${databaseId}/liveScores`),
                isCurrent: false,
                icon: "fas faBroadcastTower"
            },
            {
                type: 'link' as const,
                label: "Playoffs",
                navigate: () => navigate(`${rootPath}/scoring/databases/${databaseId}/playoffs`),
                isCurrent: false,
                icon: "fas faPeopleArrows"
            },
            {
                type: 'link' as const,
                label: "Awards",
                navigate: () => navigate(`${rootPath}/scoring/databases/${databaseId}/awards`),
                isCurrent: false,
                icon: "fas faTrophy"
            },
            {
                type: 'link' as const,
                label: "Manual Entry",
                navigate: () => navigate(`${rootPath}/scoring/databases/${databaseId}/manualEntry`),
                isCurrent: false,
                icon: "fas faPenToSquare"
            }]
    };
}

const router = createHashRouter([
    {
        path: "/",
        element: <RootLayout loadingElementId="event-fallback" />,
        errorElement: <ErrorPage loadingElementId="event-fallback" />,
        children: [
            {
                path: "/",
                element: <ProtectedRoute permissionCheck={profile => profile.canCreateEvents} />,
                children: [
                    {
                        path: "/",
                        element: <EventProvider />,
                        children: [
                            {
                                path: "/:eventId?",
                                element: <RegistrationProvider />,
                                children: [
                                    {
                                        path: "/:eventId?/registration/general",
                                        element: <RegistrationGeneralPage />
                                    },
                                    {
                                        path: "/:eventId?/registration/teamsAndQuizzers",
                                        element: <RegistrationTeamsAndQuizzersPage />
                                    },
                                    {
                                        path: "/:eventId?/registration/officials",
                                        element: <RegistrationOfficialsPage />
                                    },
                                    {
                                        path: "/:eventId?/registration/requiredFields",
                                        element: <RegistrationRequiredFieldsPage />
                                    },
                                    {
                                        path: "/:eventId?/registration/customFields",
                                        element: <RegistrationCustomFieldsPage />
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
                                        path: "/:eventId/scoring/databases/:databaseId",
                                        element: <ScoringDatabaseProvider />,
                                        children: [
                                            {
                                                path: "/:eventId/scoring/databases/:databaseId",
                                                element: <ScoringDatabaseGeneralPage />
                                            },
                                            {
                                                path: "/:eventId/scoring/databases/:databaseId/meets",
                                                element: <ScoringDatabaseMeetsPage />
                                            },
                                            {
                                                path: "/:eventId/scoring/databases/:databaseId/teamsAndQuizzers",
                                                element: <ScoringDatabaseTeamsAndQuizzersPage />
                                            },
                                            {
                                                path: "/:eventId/scoring/databases/:databaseId/liveScores",
                                                element: <ScoringDatabaseLiveScoresPage />
                                            },
                                            {
                                                path: "/:eventId/scoring/databases/:databaseId/playoffs",
                                                element: <ScoringDatabasePlayoffsPage />
                                            },
                                            {
                                                path: "/:eventId/scoring/databases/:databaseId/awards",
                                                element: <ScoringDatabaseAwardsPage />
                                            },
                                            {
                                                path: "/:eventId/scoring/databases/:databaseId/manualEntry",
                                                element: <ScoringDatabaseManualEntryPage />
                                            },
                                        ]
                                    },
                                    {
                                        path: "/:eventId/scoring/addDatabase",
                                        element: <ScoringDatabaseNewPage />
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
                    }
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