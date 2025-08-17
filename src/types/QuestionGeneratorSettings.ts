/**
 * Settings for the JBQ question generator page.
 */
export interface JbqQuestionGeneratorSettings {

    /**
     * Seasons available for the generator.
     */
    Seasons: number[];

    /**
     * Current season for the generator.
     */
    CurrentSeason: number;

    /**
     * Sorted keys for the categories in each group.
     */
    GroupCategoryKeys: string[][];

    /**
     * Ordered list of category keys.
     */
    OrderedCategoryKeys: string[];

    /**
     * Labels for Categories
     */
    CategoryLabels: Record<string, string>;
}