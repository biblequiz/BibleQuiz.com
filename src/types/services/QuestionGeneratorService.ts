import type { AuthManager } from "../AuthManager";
import { RemoteServiceModelBase, RemoteServiceUrlBase, RemoteServiceUtility } from "./RemoteServiceUtility";

const URL_ROOT_PATH = "/api/QuestionGenerator";

/**
 * Controller for generating questions.
 */
export class QuestionGeneratorService {

    /**
     * Retrieves the previously generated sets.
     *
     * @param auth AuthManager to use for authentication.
     */
    public static getPreviousSets(
        auth: AuthManager): Promise<PreviouslyGeneratedSet[]> {

        return RemoteServiceUtility.executeHttpRequest<PreviouslyGeneratedSet[]>(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Previous`);
    }

    /**
     * Retrieves the criteria for a previously generated set.
     *
     * @param auth AuthManager to use for authentication.
     * @param id Id for the set.
     */
    public static getPreviousSetCriteria(
        auth: AuthManager,
        id: string): Promise<QuestionSelectionCriteria> {

        return RemoteServiceUtility.executeHttpRequest<QuestionSelectionCriteria>(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Previous/${id}/Criteria`);
    }

    /**
     * Deletes an existing previous set.
     *
     * @param auth AuthManager to use for authentication.
     * @param id Id for the set.
     */
    public static deletePreviousSet(
        auth: AuthManager,
        id: string): Promise<void> {

        return RemoteServiceUtility.executeHttpRequestWithoutResponse(
            auth,
            "DELETE",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Previous/${id}`);
    }

    /**
     * Generates questions based on criteria.
     *
     * @param auth AuthManager to use for authentication.
     * @param criteria Criteria for generating questions.
     */
    public static selectQuestions(
        auth: AuthManager,
        criteria: QuestionSelectionCriteria): Promise<QuestionSelectionResult> {

        return RemoteServiceUtility.executeHttpRequest<QuestionSelectionResult>(
            auth,
            "POST",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Select`,
            null,
            criteria);
    }

    /**
     * Generates a URL for creating the set.
     *
     * @param id Id for the set.
     * @param format Format for the output.
     * @param fontName Name of the font when format is Pdf.
     * @param fontSize Size of the font when format is Pdf.
     * @param columns Number of columns to use when format is Pdf.
     * 
     * @returns URL to download the file.
     */
    public static getGeneratedSetUrl(
        id: string,
        format: QuestionOutputFormat,
        fontName: string | null = null,
        fontSize: number | null = null,
        columns: number | null = null): string {

        return RemoteServiceUtility.buildUrl(
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Previous/${id}/Generate`,
            RemoteServiceUtility.getFilteredUrlParameters({
                format: QuestionOutputFormat[format],
                font: fontName,
                size: fontSize,
                col: columns
            }));
    }
}

/**
 * Previously generated sets of questions.
 */
export class PreviouslyGeneratedSet extends RemoteServiceModelBase<string> {
    /**
     * Title for the set.
     */
    public readonly Title!: string;

    /**
     * Date when the set was generated.
     */
    public readonly Generated!: string;

    /**
     * Number of matches in the set.
     */
    public readonly Matches!: number;

    /**
     * Number of questions in the set.
     */
    public readonly Questions!: number;
}

/**
 * Criteria for selecting questions.
 */
export class QuestionSelectionCriteria {

    /**
     * Season for the Factpak. If this is null, the current season will be used.
     */
    public Season!: number;

    /**
     * Language to use for the questions.
     */
    public Language!: QuestionLanguage;

    /**
     * Title for the criteria.
     */
    public Title!: string;

    /**
     * Mode for the generated set.
     */
    public Mode!: string | null;

    /**
     * Rule category for the generated set.
     */
    public Rules!: string | null;

    /**
     * Number of matches to generate.
     */
    public Matches!: number;

    /**
     * Mode for duplicate question selection.
     */
    public Duplicates!: DuplicateQuestionMode;

    /**
     * Override for the number of point values of each count.
     */
    public PointValueCounts: Record<number, number> | null = {};

    /**
     * Override for the rules for each point value.
     */
    public PointValueRules!: Record<number, QuestionPointValueRules> | null;

    /**
     * Explicit ordering of point values for regular questions for each match. If this is non-null, it overrides PointValueCounts and PointValueRules.
     */
    public RegularPointOverride!: number[] | null;

    /**
     * Point values for substitute questions (if any).
     */
    public SubstituteQuestions: number[] = [];

    /**
     * Point value counts for any overtime questions (if any). These will be randomized.
     */
    public OvertimeQuestions: Record<number, number> = {};

    /**
     * Type of questions to include.
     */
    public QuestionTypes!: QuestionTypeFilter;

    /**
     * Categories of questions to include. If null, all categories will be included.
     */
    public Categories!: string[] | null;

    /**
     * Groups of categories to include. If null, all groups will be included.
     */
    public CategoryGroups!: number[] | null;

    /**
     * Filter for ranges of question ids.
     */
    public QuestionRanges!: QuestionRangeFilter[] | null;

    /**
     * Seed to use for randomization.
     */
    public Seed!: string | null;
}

/**
 * Language of the question.
 */
export enum QuestionLanguage {

    /**
     * English.
     */
    English = "English",
}

/**
 * Mode for duplicate questions.
 */
export enum DuplicateQuestionMode {

    /**
     * No duplicates will be selected until ALL other questions have been chosen.
     */
    NoDuplicates = "NoDuplicates",

    /**
     * No duplicates will be selected within a single match but may be selected in other matches.
     */
    AllowDuplicatesInOtherMatches = "AllowDuplicatesInOtherMatches"
}

/**
 * Rules about question point values.
 */
export class QuestionPointValueRules {

    /**
     * Value indicating requirements for this point value for the first question.
     */
    public First!: QuestionPositionRequirement;

    /**
     * Value indicating requirements for this point value for the last question.
     */
    public Last!: QuestionPositionRequirement;

    /**
     * Number of questions of this point value that must be in each half of the match.
     */
    public PerHalfCount!: number | null;

    /**
     * Value indicating whether this point value can be asked consecutively.
     */
    public AllowConsecutive!: boolean;
}

/**
 * Requirement for a question's position.
 */
export enum QuestionPositionRequirement {

    /**
     * Allowed to be in the position, but not required.
     */
    Allowed = "Allowed",

    /**
     * Required to be at the specified position.
     */
    Required = "Required",

    /**
     * Not allowed to be in the specific position.
     */
    NotAllowed = "NotAllowed",
}

/**
 * Filter for the question type.
 */
export enum QuestionTypeFilter {

    /**
     * All types of questions.
     */
    All = "All",

    /**
     * Only quotation questions.
     */
    QuotationOnly = "QuotationOnly",

    /**
     * All questions except quotations.
     */
    NonQuotation = "NonQuotation"
}

/**
 * Filter for a range of questions.
 */
export class QuestionRangeFilter {

    /**
     * First question number.
     */
    public Start!: number;

    /**
     * Last question number.
     */
    public End!: number;
}

/**
 * Result of selecting questions.
 */
export class QuestionSelectionResult {

    /**
     * Id for the generation.
     */
    public Id!: string;
}

/**
 * Format for the question output.
 */
export enum QuestionOutputFormat {

    /**
     * PDF File.
     */
    Pdf,

    /**
     * ScoreKeep File.
     */
    ScoreKeep
}