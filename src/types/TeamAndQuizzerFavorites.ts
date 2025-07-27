
/**
 * Favorites for teams and quizzers.
 */
export class TeamAndQuizzerFavorites {

    private static readonly StorageKey: string = "team_quizzer_favorites";

    private currentVersion: number;

    /**
     * Private constructor.
     */
    private constructor(existing: SerializedFavorites | null) {
        this.currentVersion = existing?.version ?? 1;
        this.teamIds = new Set(existing?.teams.slice(-250) ?? []);
        this.quizzerIds = new Set(existing?.quizzers.slice(-250) ?? []);
    }

    /**
     * Version of the favorites.
     */
    public get version(): number {
        return this.currentVersion;
    }

    /**
     * Ids for the favorite teams.
     */
    public readonly teamIds: Set<string>;

    /**
     * Ids for the favorite quizzers.
     */
    public readonly quizzerIds: Set<string>;

    /**
     * Loads favorites for a specific event.
     * 
     * @param eventId Id for the event.
     * @returns Persisted favorites (if any) or an initialized instance with empty sets.
     */
    public static load(): TeamAndQuizzerFavorites {

        const serializedJson: string | null = localStorage.getItem(TeamAndQuizzerFavorites.StorageKey);
        if (serializedJson) {
            try {
                const parsed: SerializedFavorites = JSON.parse(serializedJson);
                return new TeamAndQuizzerFavorites(parsed);
            }
            catch (e) {
                console.error(`Failed to parse favorites:`, e);
            }
        }

        return new TeamAndQuizzerFavorites(null);
    }

    /**
     * Persists the current favorites to local storage.
     */
    public save(): void {

        // Persist the results.
        const serialized: SerializedFavorites = {
            version: this.currentVersion + 1,
            teams: Array.from(this.teamIds),
            quizzers: Array.from(this.quizzerIds),
        };

        localStorage.setItem(TeamAndQuizzerFavorites.StorageKey, JSON.stringify(serialized));

        // Increment the current version.
        this.currentVersion++;
    }
}

interface SerializedFavorites {
    teams: string[];
    quizzers: string[];
    version: number;
}