import { createHashRouter, RouterProvider, Outlet, useNavigate, useMatches, type UIMatch, useParams, type Params, type NavigateFunction, useLocation, useBlocker } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { BlockerCallbackResult, sharedDirtyWindowState, sharedRequireBlockerCallback } from 'utils/SharedState';
import ConfirmationDialog from '../../ConfirmationDialog';
import ProtectedRoute from '../../auth/ProtectedRoute';
import { reactSidebarEntries, type ReactSidebarEntry, type ReactSidebarGroup, type ReactSidebarLink } from 'components/sidebar/ReactSidebar';
import EventPermissionsPage from './EventPermissionsPage';
import EventRegistrationsPage from './EventRegistrationsPage';
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
import ScoringSettingsPage from './scoring/ScoringSettingsPage';
import ScoringDatabaseProvider from './scoring/ScoringDatabaseProvider';
import ScoringDatabaseMeetsPage from './scoring/ScoringDatabaseMeetsPage';
import ScoringDatabaseLiveScoresPage from './scoring/ScoringDatabaseLiveScoresPage';
import ScoringDatabasePlayoffsPage from './scoring/ScoringDatabasePlayoffsPage';
import ScoringDatabaseTeamsAndQuizzersPage from './scoring/ScoringDatabaseTeamsAndQuizzersPage';
import ScoringDatabaseAwardsPage from './scoring/ScoringDatabaseAwardsPage';
import ScoringDatabaseManualEntryPage from './scoring/ScoringDatabaseManualEntryPage';
import EventProvider, { NEW_ID_PLACEHOLDER } from './EventProvider';
import ScoringDatabaseNewPage from './scoring/ScoringDatabaseNewPage';
import { AuthManager } from 'types/AuthManager';
import EventDashboardPage from './EventDashboardPage';
import DeleteEventPage from './DeleteEventPage';
import EmailEventPage from './EmailEventPage';
import CloneEventPage from './CloneEventPage';
import { createMultiReactAtom } from 'utils/MultiReactNanoStore';
import ScoringDatabaseDeletePage from './scoring/ScoringDatabaseDeletePage';
import ScoringDatabaseAppsPage from './scoring/ScoringDatabaseAppsPage';
import ScoringDashboardPage from './scoring/ScoringDashboardPage';
import EventPaymentsPage from './EventPaymentsPage';
import EventSummaryProvider from './EventSummaryProvider';
import EventPaymentsReceiptPage from './EventPaymentsReceiptPage';
import EventReportsPage from './EventReportsPage';
import EventReportsProvider from './EventReportsProvider';
import EventReportSettingsPage from './report/EventReportSettingsPage';
import DebugEventPage from './DebugEventPage';
import type { OnlineDatabaseSummary } from 'types/services/AstroDatabasesService';

interface Props {
    loadingElementId: string;
}

const DASHBOARD_ID = "dashboard";
const SCORES_GROUP_ID = "scores";
const DATABASE_GROUP_ID_PREFIX = "db-";
const DATABASE_LOADING_ID = DATABASE_GROUP_ID_PREFIX + "loading";
const PERMISSIONS_ID = "permissions";
const DEBUG_ID = "debug";
const REGISTRATIONS_ID = "registrations";
const PAYMENTS_ID = "payments";
const PAYMENTS_RECEIPT_ID = "payments-receipt";
const REPORTS_ID = "reports";
const REPORT_SETTINGS_ID = "report-settings";
const CLONE_ID = "clone";
const EMAIL_ID = "email";
const DELETE_ID = "delete";

export const currentDatabaseSummaries = createMultiReactAtom<OnlineDatabaseSummary[] | undefined>(
    "databaseSummaries",
    undefined);

function RootLayout({ loadingElementId }: Props) {

    const auth = AuthManager.useNanoStore();
    const databases = useStore(currentDatabaseSummaries);

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
            showParent: auth.userProfile?.canManageEvents ?? false,
            refreshShowParent: (s, p) => s.showParent = p?.canManageEvents ?? false,
            entries: buildSidebar(
                routeMatches,
                routeParameters,
                databases,
                navigate)
        });
    }, [location.pathname, auth, blocker, databases]);

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
    databases: OnlineDatabaseSummary[] | undefined,
    navigate: NavigateFunction): ReactSidebarEntry[] {

    if (routeParameters["*"]) {
        return [];
    }

    const eventId = routeParameters.eventId as string;
    const rootEventPath = eventId ? `/${eventId}` : "";

    const sidebarEntries: ReactSidebarEntry[] =
        [
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
            } as ReactSidebarGroup
        ];

    let currentPage: any = undefined;
    const lastSegmentId = routeMatches[routeMatches.length - 1].id;
    if (eventId && eventId !== NEW_ID_PLACEHOLDER) {

        const dashboardEntry: ReactSidebarLink =
        {
            type: 'link' as const,
            label: "Dashboard",
            navigate: () => navigate(`${rootEventPath}/dashboard`),
            isCurrent: false,
            icon: "fas faGauge"
        };
        sidebarEntries.unshift(dashboardEntry);

        let databaseEntries: ReactSidebarEntry[];
        if (databases) {
            databaseEntries = databases.map(
                db => buildDatabaseEntry(rootEventPath, db.Settings.DatabaseId!, db.Settings.DatabaseName.replaceAll('_', ' '), navigate));

            databaseEntries.push({
                type: 'link' as const,
                id: DATABASE_GROUP_ID_PREFIX + "new",
                label: "Add Database",
                navigate: () => navigate(`${rootEventPath}/scoring/addDatabase`),
                isCurrent: false,
                icon: "fas faPlus"
            } as ReactSidebarEntry);
        }
        else {
            databaseEntries = [{
                type: 'link' as const,
                id: DATABASE_LOADING_ID,
                label: "Loading Databases ...",
                navigate: () => { },
                isCurrent: false,
                icon: "fas faSpinner",
                iconClass: ["fa-spin"]
            } as ReactSidebarEntry];
        }

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
                        entries: databaseEntries
                    }
                ]
            } as ReactSidebarGroup);

        const registrationsEntry: ReactSidebarLink =
        {
            type: 'link' as const,
            label: "Downloads & Registrations",
            navigate: () => navigate(`${rootEventPath}/summary/registrations`),
            isCurrent: false,
            icon: "fas faFileImport"
        };
        sidebarEntries.push(registrationsEntry);

        const paymentsEntry: ReactSidebarLink =
        {
            type: 'link' as const,
            label: "Fees & Payments",
            navigate: () => navigate(`${rootEventPath}/summary/payments`),
            isCurrent: false,
            icon: "fas faSackDollar"
        };
        sidebarEntries.push(paymentsEntry);

        const reportsEntry: ReactSidebarLink =
        {
            type: 'link' as const,
            label: "Reports",
            navigate: () => navigate(`${rootEventPath}/reports`),
            isCurrent: false,
            icon: "fas faBook"
        };
        sidebarEntries.push(reportsEntry);

        const permissionsEntry: ReactSidebarLink =
        {
            type: 'link' as const,
            label: "Permissions",
            navigate: () => navigate(`${rootEventPath}/permissions`),
            isCurrent: false,
            icon: "fas faLock"
        };
        sidebarEntries.push(permissionsEntry);

        const emailEntry: ReactSidebarLink =
        {
            type: 'link' as const,
            label: "E-mail",
            navigate: () => navigate(`${rootEventPath}/email`),
            isCurrent: false,
            icon: "fas faEnvelope"
        };
        sidebarEntries.push(emailEntry);

        const cloneEntry: ReactSidebarLink =
        {
            type: 'link' as const,
            label: "Clone & Copy",
            navigate: () => navigate(`${rootEventPath}/clone`),
            isCurrent: false,
            icon: "fas faClone"
        };
        sidebarEntries.push(cloneEntry);

        const debugEntry: ReactSidebarLink =
        {
            type: 'link' as const,
            label: "Help & Debug",
            navigate: () => navigate(`${rootEventPath}/debug`),
            isCurrent: false,
            icon: "fas faCircleQuestion"
        };
        sidebarEntries.push(debugEntry);

        const deleteEntry: ReactSidebarLink =
        {
            type: 'link' as const,
            label: "Delete Event",
            navigate: () => navigate(`${rootEventPath}/delete`),
            isCurrent: false,
            icon: "fas faTrash"
        };
        sidebarEntries.push(deleteEntry);

        switch (lastSegmentId) {
            case DASHBOARD_ID:
                currentPage = dashboardEntry;
                break;
            case REGISTRATIONS_ID:
                currentPage = registrationsEntry;
                break;
            case PAYMENTS_ID:
            case PAYMENTS_RECEIPT_ID:
                currentPage = paymentsEntry;
                break;
            case REPORTS_ID:
            case REPORT_SETTINGS_ID:
                currentPage = reportsEntry;
                break;
            case PERMISSIONS_ID:
                currentPage = permissionsEntry;
                break;
            case EMAIL_ID:
                currentPage = emailEntry;
                break;
            case CLONE_ID:
                currentPage = cloneEntry;
                break;
            case DEBUG_ID:
                currentPage = debugEntry;
                break;
            case DELETE_ID:
                currentPage = deleteEntry;
                break;
        }
    }

    // Determine the current page (if it isn't already known).
    if (!currentPage) {
        const segmentIndexes = lastSegmentId
            .substring(6)
            .split('-')
            .map(s => parseInt(s));

        // When there is a new event, the first link for the dashboard doesn't appear.
        if (eventId === NEW_ID_PLACEHOLDER && segmentIndexes.length > 0 &&
            segmentIndexes[0] === 1) {
            segmentIndexes[0] = 0;
        }

        currentPage = { entries: sidebarEntries };
        for (const segment of segmentIndexes) {
            const currentPageGroup = currentPage as ReactSidebarGroup;

            let segmentOffset = 0;
            if (currentPageGroup.id === SCORES_GROUP_ID && segment > 0) {
                currentPage = currentPage.entries[1]; // Databases section.

                // Handle the scenario where the databases are still loading.
                if (currentPage.entries.length === 1 &&
                    currentPage.entries[0].id === DATABASE_LOADING_ID) {
                    return sidebarEntries;
                }

                let entryIndex = 0;
                const findId = DATABASE_GROUP_ID_PREFIX + (routeParameters.databaseId ?? "new");
                for (const child of currentPage.entries) {
                    if (child.id === findId) {
                        break;
                    }

                    entryIndex++;
                }

                if (entryIndex < currentPage.entries.length) {
                    segmentOffset = entryIndex - segment;
                }
            }

            currentPage = (currentPage as ReactSidebarGroup).entries[segment + segmentOffset];
        }
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
                label: "Dashboard",
                navigate: () => navigate(`${rootPath}/scoring/databases/${databaseId}/dashboard`),
                isCurrent: false,
                icon: "fas faGauge"
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
                label: "Devices & Apps",
                navigate: () => navigate(`${rootPath}/scoring/databases/${databaseId}/apps`),
                isCurrent: false,
                icon: "fas faTabletAlt"
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
            },
            {
                type: 'link' as const,
                label: "Delete Database",
                navigate: () => navigate(`${rootPath}/scoring/databases/${databaseId}/delete`),
                isCurrent: false,
                icon: "fas faTrash"
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
                element: <ProtectedRoute permissionCheck={profile => profile.canManageEvents} />,
                children: [
                    {
                        path: "/",
                        element: <EventProvider />,
                        children: [
                            {
                                path: "/:eventId/dashboard",
                                id: DASHBOARD_ID,
                                element: <EventDashboardPage />
                            },
                            {
                                path: "/:eventId",
                                element: <RegistrationProvider />,
                                children: [
                                    {
                                        path: "/:eventId/registration/general",
                                        element: <RegistrationGeneralPage />
                                    },
                                    {
                                        path: "/:eventId/registration/teamsAndQuizzers",
                                        element: <RegistrationTeamsAndQuizzersPage />
                                    },
                                    {
                                        path: "/:eventId/registration/officials",
                                        element: <RegistrationOfficialsPage />
                                    },
                                    {
                                        path: "/:eventId/registration/requiredFields",
                                        element: <RegistrationRequiredFieldsPage />
                                    },
                                    {
                                        path: "/:eventId/registration/customFields",
                                        element: <RegistrationCustomFieldsPage />
                                    },
                                    {
                                        path: "/:eventId/registration/divisions",
                                        element: <RegistrationDivisionsPage />
                                    },
                                    {
                                        path: "/:eventId/registration/forms",
                                        element: <RegistrationFormsPage />
                                    },
                                    {
                                        path: "/:eventId/registration/money",
                                        element: <RegistrationMoneyPage />
                                    },
                                    {
                                        path: "/:eventId/registration/other",
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
                                                path: "/:eventId/scoring/databases/:databaseId/dashboard",
                                                element: <ScoringDashboardPage />
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
                                                path: "/:eventId/scoring/databases/:databaseId/apps",
                                                element: <ScoringDatabaseAppsPage />
                                            },
                                            {
                                                path: "/:eventId/scoring/databases/:databaseId/awards",
                                                element: <ScoringDatabaseAwardsPage />
                                            },
                                            {
                                                path: "/:eventId/scoring/databases/:databaseId/manualEntry",
                                                element: <ScoringDatabaseManualEntryPage />
                                            },
                                            {
                                                path: "/:eventId/scoring/databases/:databaseId/delete",
                                                element: <ScoringDatabaseDeletePage />
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
                                path: "/:eventId/summary",
                                element: <EventSummaryProvider />,
                                children: [
                                    {
                                        path: "/:eventId/summary/registrations",
                                        id: REGISTRATIONS_ID,
                                        element: <EventRegistrationsPage />
                                    },
                                    {
                                        path: "/:eventId/summary/payments",
                                        id: PAYMENTS_ID,
                                        element: <EventPaymentsPage />
                                    },
                                    {
                                        path: "/:eventId/summary/payments/:churchId",
                                        id: PAYMENTS_RECEIPT_ID,
                                        element: <EventPaymentsReceiptPage />
                                    }]
                            },
                            {
                                path: "/:eventId/reports",
                                element: <EventReportsProvider />,
                                children: [
                                    {
                                        path: "/:eventId/reports",
                                        id: REPORTS_ID,
                                        element: <EventReportsPage />
                                    },
                                    {
                                        path: "/:eventId/reports/:type/:reportId",
                                        id: REPORT_SETTINGS_ID,
                                        element: <EventReportSettingsPage />
                                    }
                                ]
                            },
                            {
                                path: "/:eventId/email",
                                id: EMAIL_ID,
                                element: <EmailEventPage />
                            },
                            {
                                path: "/:eventId/clone",
                                id: CLONE_ID,
                                element: <CloneEventPage />
                            },
                            {
                                path: "/:eventId/permissions",
                                id: PERMISSIONS_ID,
                                element: <EventPermissionsPage />
                            },
                            {
                                path: "/:eventId/debug",
                                id: DEBUG_ID,
                                element: <DebugEventPage />
                            },
                            {
                                path: "/:eventId/delete",
                                id: DELETE_ID,
                                element: <DeleteEventPage />
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