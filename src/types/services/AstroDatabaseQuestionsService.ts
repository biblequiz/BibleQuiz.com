import type { AuthManager } from "../AuthManager";
import {
    RemoteServiceUrlBase,
    RemoteServiceUtility,
} from "./RemoteServiceUtility";

const URL_ROOT_PATH = "/api/v1.0/events";

/**
 * Wrapper for the Astro Database Questions service.
 */
export class AstroDatabaseQuestionsService {
    /**
     * Retrieves all question sets for the database.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     *
     * @returns All question sets for the database.
     */
    public static getAllQuestionSets(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
    ): Promise<OnlineDatabaseQuestionSet[]> {
        return RemoteServiceUtility.executeHttpRequest<
            OnlineDatabaseQuestionSet[]
        >(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}/questions`,
        );
    }

    /**
     * Updates questions for a specific meet.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param questions Questions to update.
     */
    public static updateQuestionSet(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        questions: OnlineDatabaseQuestionSet,
    ): Promise<void> {
        return RemoteServiceUtility.executeHttpRequestWithoutResponse(
            auth,
            "PUT",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}/questions`,
            null,
            questions,
        );
    }

    /**
     * Parses questions from an uploaded file.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param meetId Id for the meet.
     * @param form Form contents with "file" set with the questions file.
     *
     * @returns Parsed question set manifest.
     */
    public static parseQuestions(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        meetId: number,
        form: FormData,
    ): Promise<OnlineDatabaseQuestionSetManifest> {
        return RemoteServiceUtility.executeHttpRequest<OnlineDatabaseQuestionSetManifest>(
            auth,
            "PUT",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}/questions/${meetId}`,
            null,
            form,
            true,
        );
    }
}

/**
 * Question set for a meet.
 */
export interface OnlineDatabaseQuestionSet {
    /**
     * Id for the meet.
     */
    readonly MeetId: number;

    /**
     * Value indicating whether scoring has started for this meet.
     */
    readonly HasScoringStarted: boolean;

    /**
     * Questions for each match in the meet. Key is the match number.
     */
    readonly Matches: Record<number, OnlineDatabaseQuestionMatchSet>;

    /**
     * Status of the import.
     */
    readonly ImportState: OnlineDatabaseQuestionSetState;
}

/**
 * State of the question set.
 */
export enum OnlineDatabaseQuestionSetState {
    /**
     * No questions have been imported for this question set.
     */
    NotImported,

    /**
     * Questions have been partially imported.
     */
    PartiallyImported,

    /**
     * All matches have been fully imported.
     */
    FullyImported,
}

/**
 * Question set for a match within a meet.
 */
export interface OnlineDatabaseQuestionMatchSet {
    /**
     * Questions for this match. Key is the question number.
     */
    readonly Questions: Record<number, OnlineMatchQuestion>;

    /**
     * Value indicating whether the questions for this set have been imported.
     */
    readonly HasImportedQuestions: boolean;
}

/**
 * Manifest returned when parsing questions.
 */
export interface OnlineDatabaseQuestionSetManifest {
    /**
     * Parsed question set.
     */
    readonly Set: OnlineDatabaseQuestionSet;

    /**
     * Error message if there were issues parsing the questions.
     */
    readonly ErrorMessage: string | null;
}

/**
 * A single match question.
 */
export interface OnlineMatchQuestion {
    /**
     * HTML formatted text of the question.
     */
    readonly HtmlText: string;

    /**
     * Plain text of the question.
     */
    readonly PlainText: string;

    /**
     * Usage type for the question.
     */
    readonly Usage: MatchQuestionUsage;

    /**
     * Point value for the question.
     */
    readonly PointValue: number;

    /**
     * Value indicating whether this question has been changed.
     */
    readonly IsChanged: boolean;
}

/**
 * Usage type for a match question.
 */
export enum MatchQuestionUsage {
    /**
     * Regular question.
     */
    Regular = 0,

    /**
     * Overtime question.
     */
    Overtime = 1,
}
