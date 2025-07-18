/**
 * Index of quizzers and pages
 */
export class QuizzerIndex {

    /**
     * Mapping of URLs to pages
     */
    public readonly pages!: PageIndexEntry[];

    /**
     * Quizzers in the index 
     */
    public readonly quizzers!: QuizzerIndexEntry[];
}

/**
 * Entry in the index for a single page
 */
export class PageIndexEntry {

    /** 
     * Title for the page 
     */
    public readonly t!: string;

    /** 
     * Url for the page
     */
    public readonly u!: string;
}

/**
 * Entry in the index for a single quizzer
 */
export class QuizzerIndexEntry {

    /**
     * Name of the quizzer
     */
    public readonly n!: string;

    /**
     * First letter of the last name for the quizzer
     */
    public readonly l!: string;

    /**
     * Other first names for the quizzer that will also appear in the index
     */
    public readonly on!: string[] | null;

    /**
     * URLs for JBQ pages.
     */
    public readonly j!: SeasonAndNonSeasonUrlCollection | null;

    /**
     * URLs for TBQ pages.
     */
    public readonly t!: SeasonAndNonSeasonUrlCollection | null;
}

/**
 * Collection of URLs for seasons and non-seasons
 */
export class SeasonAndNonSeasonUrlCollection {

    /**
     * Mapping of season number to the indexes in the pages list corresponding to the urls.
     */
    public readonly s!: Record<number, number[]> | null;

    /**
     * Mapping of non-season URLs to the indexes in the pages list corresponding to the urls.
     */
    public readonly n!: number[] | null;
}