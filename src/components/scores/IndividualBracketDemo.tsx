import IndividualBracketVisualization from "./IndividualBracketVisualization";
import type { ScoringReportMeet, ScoringReportMatchState } from "types/EventScoringReport";

/**
 * Demo component showing the IndividualBracketVisualization with sample data.
 * This demonstrates both resolved (with quizzer names) and unresolved (with routing placeholders) states.
 */
export default function IndividualBracketDemo() {
    // Sample meet data representing an 8-quizzer single elimination bracket
    const sampleMeet: ScoringReportMeet = {
        DatabaseId: "demo",
        MeetId: 1,
        CombinedName: null,
        HasLinkedMeets: false,
        HasQuestionStats: false,
        Name: "Individual Competition Demo",
        LastUpdated: new Date().toISOString(),
        CompetitionType: "Individual",
        IsIndividualCompetition: true,
        Teams: null,
        RankedTeams: null,
        TeamFootnotes: null,
        TeamRankingLabel: null,
        TeamRankingAwardsLabel: null,
        MeetNames: null,
        QuizzerRankingLabel: "Individual Ranking",
        QuizzerRankingAwardsLabel: "Rank",
        QuizzerFootnotes: null,
        HasRoomCompletionMismatch: false,
        HasScoringCompleted: false,
        ScoringProgressMessage: null,
        HasRoomCompletionMismatchForCombined: false,
        HasScoringCompletedForCombined: false,
        ScoringProgressMessageForCombined: null,
        ShowYearsQuizzing: false,
        IsCombinedReport: false,

        // 8 quizzers
        Quizzers: [
            { Id: "q1", Name: "Alice Anderson", ChurchName: "First Assembly", City: "City A", State: "ST", TeamName: "", YearsQuizzing: 2, Scores: null, Matches: null, CurrentMatchId: null },
            { Id: "q2", Name: "Bob Brown", ChurchName: "Second Church", City: "City B", State: "ST", TeamName: "", YearsQuizzing: 1, Scores: null, Matches: null, CurrentMatchId: null },
            { Id: "q3", Name: "Carol Chen", ChurchName: "Third Temple", City: "City C", State: "ST", TeamName: "", YearsQuizzing: 3, Scores: null, Matches: null, CurrentMatchId: null },
            { Id: "q4", Name: "David Davis", ChurchName: "Fourth Chapel", City: "City D", State: "ST", TeamName: "", YearsQuizzing: 2, Scores: null, Matches: null, CurrentMatchId: null },
            { Id: "q5", Name: "Eve Edwards", ChurchName: "Fifth Parish", City: "City E", State: "ST", TeamName: "", YearsQuizzing: 1, Scores: null, Matches: null, CurrentMatchId: null },
            { Id: "q6", Name: "Frank Foster", ChurchName: "Sixth Ministry", City: "City F", State: "ST", TeamName: "", YearsQuizzing: 4, Scores: null, Matches: null, CurrentMatchId: null },
            { Id: "q7", Name: "Grace Green", ChurchName: "Seventh Hall", City: "City G", State: "ST", TeamName: "", YearsQuizzing: 2, Scores: null, Matches: null, CurrentMatchId: null },
            { Id: "q8", Name: "Henry Hall", ChurchName: "Eighth Center", City: "City H", State: "ST", TeamName: "", YearsQuizzing: 1, Scores: null, Matches: null, CurrentMatchId: null },
        ],
        RankedQuizzers: null,

        // 3 matches (rounds): Round 1 (4 rooms), Semi-finals (2 rooms), Finals (1 room)
        Matches: [
            { Id: 1, MatchTime: "9:00 AM", PlayoffIndex: null, RegularQuestionStats: null },
            { Id: 2, MatchTime: "10:30 AM", PlayoffIndex: null, RegularQuestionStats: null },
            { Id: 3, MatchTime: "12:00 PM", PlayoffIndex: 1, RegularQuestionStats: null },
        ],

        // 7 rooms total across all rounds
        Rooms: [
            // Round 1 rooms (indices 0-3) - Completed with resolved quizzers
            {
                RoomId: 1,
                Name: "Room 1",
                Matches: [
                    // Match 1: Alice vs Bob - Completed
                    { CurrentQuestion: null, LinkedMeet: null, Team1: null, Team2: null, Quizzers: [0, 1], RankedTeamsOrQuizzers: null, State: "Completed" as ScoringReportMatchState, Blockers: null },
                    // Not used in Match 2
                    { CurrentQuestion: null, LinkedMeet: null, Team1: null, Team2: null, Quizzers: null, RankedTeamsOrQuizzers: null, State: "NotStarted" as ScoringReportMatchState, Blockers: null },
                    // Not used in Match 3
                    { CurrentQuestion: null, LinkedMeet: null, Team1: null, Team2: null, Quizzers: null, RankedTeamsOrQuizzers: null, State: "NotStarted" as ScoringReportMatchState, Blockers: null },
                ]
            },
            {
                RoomId: 2,
                Name: "Room 2",
                Matches: [
                    // Match 1: Carol vs David - Completed
                    { CurrentQuestion: null, LinkedMeet: null, Team1: null, Team2: null, Quizzers: [2, 3], RankedTeamsOrQuizzers: null, State: "Completed" as ScoringReportMatchState, Blockers: null },
                    // Not used
                    { CurrentQuestion: null, LinkedMeet: null, Team1: null, Team2: null, Quizzers: null, RankedTeamsOrQuizzers: null, State: "NotStarted" as ScoringReportMatchState, Blockers: null },
                    { CurrentQuestion: null, LinkedMeet: null, Team1: null, Team2: null, Quizzers: null, RankedTeamsOrQuizzers: null, State: "NotStarted" as ScoringReportMatchState, Blockers: null },
                ]
            },
            {
                RoomId: 3,
                Name: "Room 3",
                Matches: [
                    // Match 1: Eve vs Frank - In Progress
                    { CurrentQuestion: 15, LinkedMeet: null, Team1: null, Team2: null, Quizzers: [4, 5], RankedTeamsOrQuizzers: null, State: "InProgress" as ScoringReportMatchState, Blockers: null },
                    // Not used
                    { CurrentQuestion: null, LinkedMeet: null, Team1: null, Team2: null, Quizzers: null, RankedTeamsOrQuizzers: null, State: "NotStarted" as ScoringReportMatchState, Blockers: null },
                    { CurrentQuestion: null, LinkedMeet: null, Team1: null, Team2: null, Quizzers: null, RankedTeamsOrQuizzers: null, State: "NotStarted" as ScoringReportMatchState, Blockers: null },
                ]
            },
            {
                RoomId: 4,
                Name: "Room 4",
                Matches: [
                    // Match 1: Grace vs Henry - Not Started
                    { CurrentQuestion: null, LinkedMeet: null, Team1: null, Team2: null, Quizzers: [6, 7], RankedTeamsOrQuizzers: null, State: "NotStarted" as ScoringReportMatchState, Blockers: null },
                    // Not used
                    { CurrentQuestion: null, LinkedMeet: null, Team1: null, Team2: null, Quizzers: null, RankedTeamsOrQuizzers: null, State: "NotStarted" as ScoringReportMatchState, Blockers: null },
                    { CurrentQuestion: null, LinkedMeet: null, Team1: null, Team2: null, Quizzers: null, RankedTeamsOrQuizzers: null, State: "NotStarted" as ScoringReportMatchState, Blockers: null },
                ]
            },
            // Semi-final rooms (indices 4-5) - Partially resolved
            {
                RoomId: 5,
                Name: "Semi-Final A",
                Matches: [
                    // Not used in Match 1
                    { CurrentQuestion: null, LinkedMeet: null, Team1: null, Team2: null, Quizzers: null, RankedTeamsOrQuizzers: null, State: "NotStarted" as ScoringReportMatchState, Blockers: null },
                    // Match 2: 1st from Room 1 vs 1st from Room 2 - Resolved (Alice won Room 1, Carol won Room 2)
                    { CurrentQuestion: null, LinkedMeet: null, Team1: null, Team2: null, Quizzers: [0, 2], RankedTeamsOrQuizzers: null, State: "Completed" as ScoringReportMatchState, Blockers: null },
                    // Not used in Match 3
                    { CurrentQuestion: null, LinkedMeet: null, Team1: null, Team2: null, Quizzers: null, RankedTeamsOrQuizzers: null, State: "NotStarted" as ScoringReportMatchState, Blockers: null },
                ]
            },
            {
                RoomId: 6,
                Name: "Semi-Final B",
                Matches: [
                    // Not used in Match 1
                    { CurrentQuestion: null, LinkedMeet: null, Team1: null, Team2: null, Quizzers: null, RankedTeamsOrQuizzers: null, State: "NotStarted" as ScoringReportMatchState, Blockers: null },
                    // Match 2: 1st from Room 3 vs 1st from Room 4 - Unresolved (rooms not complete)
                    { CurrentQuestion: null, LinkedMeet: null, Team1: null, Team2: null, Quizzers: null, RankedTeamsOrQuizzers: [{ Room: 2, Rank: 1 }, { Room: 3, Rank: 1 }], State: "NotStarted" as ScoringReportMatchState, Blockers: null },
                    // Not used in Match 3
                    { CurrentQuestion: null, LinkedMeet: null, Team1: null, Team2: null, Quizzers: null, RankedTeamsOrQuizzers: null, State: "NotStarted" as ScoringReportMatchState, Blockers: null },
                ]
            },
            // Finals room (index 6)
            {
                RoomId: 7,
                Name: "Finals",
                Matches: [
                    // Not used in Match 1
                    { CurrentQuestion: null, LinkedMeet: null, Team1: null, Team2: null, Quizzers: null, RankedTeamsOrQuizzers: null, State: "NotStarted" as ScoringReportMatchState, Blockers: null },
                    // Not used in Match 2
                    { CurrentQuestion: null, LinkedMeet: null, Team1: null, Team2: null, Quizzers: null, RankedTeamsOrQuizzers: null, State: "NotStarted" as ScoringReportMatchState, Blockers: null },
                    // Match 3 (Finals): 1st from Semi-Final A vs 1st from Semi-Final B
                    { CurrentQuestion: null, LinkedMeet: null, Team1: null, Team2: null, Quizzers: null, RankedTeamsOrQuizzers: [{ Room: 4, Rank: 1 }, { Room: 5, Rank: 1 }], State: "NotStarted" as ScoringReportMatchState, Blockers: null },
                ]
            },
        ],
    };

    const handleRoomClick = (roomIndex: number, matchIndex: number) => {
        console.log(`Clicked room ${roomIndex} in match ${matchIndex}`);
        alert(`Clicked: Room ${roomIndex + 1}, Match ${matchIndex + 1}`);
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Individual Bracket Visualization Demo</h2>
            <p className="mb-4 text-sm text-base-content/70">
                This demo shows an 8-quizzer single elimination bracket with various states:
                completed rooms (green border), in-progress (blue border), and not started.
                Unresolved matchups show placeholders like "1st from Room 1".
            </p>
            <IndividualBracketVisualization
                meet={sampleMeet}
                eventId="demo-event"
                onRoomClick={handleRoomClick}
            />
        </div>
    );
}