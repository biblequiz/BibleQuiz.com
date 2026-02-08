import type { AuthManager } from "../AuthManager";
import type { Team, Quizzer } from "../Meets";
import type { Church } from "./ChurchesService";
import { RemoteServiceUrlBase, RemoteServiceUtility } from './RemoteServiceUtility';

const URL_ROOT_PATH = "/api/v1.0/events";

/**
 * Wrapper for the Astro Teams and Quizzers service.
 */
export class AstroTeamsAndQuizzersService {

    /**
     * Retrieves all teams and quizzers for a database.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * 
     * @returns Manifest of all teams and quizzers.
     */
    public static getTeamsAndQuizzers(
        auth: AuthManager,
        eventId: string,
        databaseId: string): Promise<OnlineTeamsAndQuizzers> {

        return RemoteServiceUtility.executeHttpRequest<OnlineTeamsAndQuizzers>(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}/teamsAndQuizzers`);
    }

    /**
     * Updates the teams and quizzers for a database.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param changes Changes to apply to the teams and quizzers.
     * 
     * @returns Updated manifest of all teams and quizzers.
     */
    public static updateTeamsAndQuizzers(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        changes: OnlineTeamsAndQuizzersChanges): Promise<OnlineTeamsAndQuizzers> {

        return RemoteServiceUtility.executeHttpRequest<OnlineTeamsAndQuizzers>(
            auth,
            "PUT",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}/teamsAndQuizzers`,
            null,
            changes);
    }

    /**
     * Processes a report file to extract teams and quizzers for import.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param form Form contents with "name" and "file" set with the appropriate values.
     * 
     * @returns Manifest of teams and quizzers extracted from the report.
     */
    public static processReportForImport(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        form: FormData): Promise<OnlineTeamsAndQuizzersImportManifest> {

        return RemoteServiceUtility.executeHttpRequest<OnlineTeamsAndQuizzersImportManifest>(
            auth,
            "POST",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}/teamsAndQuizzers/processReport`,
            null,
            form,
            true);
    }
}

/**
 * Manifest of all teams and quizzers within a database.
 */
export interface OnlineTeamsAndQuizzers {
    /**
     * Teams for the manifest.
     */
    Teams: Record<number, OnlineTeamsAndQuizzersTeam>;

    /**
     * Quizzers for the manifest.
     */
    Quizzers: Record<number, OnlineTeamsAndQuizzersQuizzer>;

    /**
     * Any churches associated with this event (GUID to Church mapping).
     */
    Churches: Record<string, Church>;

    /**
     * Any people associated with this event (GUID to name mapping).
     */
    People: Record<string, string>;

    /**
     * Ids of meets that have scores.
     */
    MeetIdsWithScores: number[];

    /**
     * Next id for a new team.
     */
    NextTeamId: number;

    /**
     * Next id for a new quizzer.
     */
    NextQuizzerId: number;

    /**
     * Version of the teams and quizzers.
     */
    VersionId: string;
}

/**
 * Manifest for an individual team.
 */
export interface OnlineTeamsAndQuizzersTeam {
    /**
     * Team for the manifest.
     */
    Team: Team;

    /**
     * Ids where this team is registered.
     */
    MeetIds: number[];
}

/**
 * Manifest for an individual quizzer.
 */
export interface OnlineTeamsAndQuizzersQuizzer {

    /**
     * Quizzer for the manifest.
     */
    Quizzer: Quizzer;

    /**
     * Mapping of meets to the associated team for this quizzer in that meet (if any).
     */
    MeetTeamIds: Record<number, number | null>;
}

/**
 * Collection of changes to teams and quizzers within a database.
 */
export interface OnlineTeamsAndQuizzersChanges {

    /**
     * Added or updated teams. If the Team.Id is found in AddedTeamIds, it will be considered added.
     */
    AddedOrUpdatedTeams: Record<number, Team>;

    /**
     * Ids that will appear in AddedOrUpdatedTeams or be referenced by Quizzer.TeamId.
     */
    AddedTeamIds: number[];

    /**
     * Ids for teams that have been removed.
     */
    RemovedTeamIds: number[];

    /**
     * Added or updated quizzers. If the Quizzer.Id is found in AddedQuizzerIds, it will be considered added.
     */
    AddedOrUpdatedQuizzers: Record<number, Quizzer>;

    /**
     * Ids that will appear in AddedOrUpdatedQuizzers or referenced by Team.TotalQuizzerId.
     */
    AddedQuizzerIds: number[];

    /**
     * Ids for quizzers that have been removed.
     */
    RemovedQuizzerIds: number[];

    /**
     * Version of the teams and quizzers when they were last retrieved.
     */
    VersionId: string;
}

/**
 * Manifest of imported teams and quizzers.
 */
export interface OnlineTeamsAndQuizzersImportManifest {

    /**
     * Teams included in the manifest.
     */
    Teams: Record<number, Team>;

    /**
     * Quizzers included in the manifest.
     */
    Quizzers: Record<number, Quizzer>;
}