import { useRef, useEffect } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { Quizzer, Team } from "types/Meets";
import type { OnlineDatabaseMeetSettings } from "types/services/AstroDatabasesService";

export interface TeamStats {
    team: Team;
    meets: Record<number, { meet: OnlineDatabaseMeetSettings, hasScores: boolean }>;
}

export interface QuizzerStats {
    quizzer: Quizzer;
    meets: Record<number, { meet: OnlineDatabaseMeetSettings, teamName: string | undefined, hasScores: boolean }>;
}

interface Props {
    team: TeamStats | null;
    quizzer: QuizzerStats | null;
    onClose: () => void;
}

export default function StatsDialog({
    team,
    quizzer,
    onClose }: Props) {

    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        dialogRef.current?.showModal();
    }, []);

    const handleClose = () => {
        onClose();
        dialogRef.current?.close();
    };

    const typeLabel = team ? "Team" : "Quizzer";
    const icon = team ? "fas faUsers" : "fas faUser";
    const hasMeets = team
        ? Object.keys(team.meets).length > 0
        : quizzer
            ? Object.keys(quizzer.meets).length > 0
            : false;

    return (
        <dialog ref={dialogRef} className="modal" onClose={handleClose}>
            <div className="modal-box w-full max-w-xl">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <FontAwesomeIcon icon={icon} />
                    Divisions for {typeLabel}: {team ? team.team.Name : quizzer?.quizzer.Name}
                </h3>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 mt-0"
                    onClick={handleClose}
                >
                    ✕
                </button>

                <div className="mt-4">
                    {!hasMeets && (
                        <div className="p-8 border border-dashed border-base-300 rounded-lg bg-base-200 text-center">
                            <FontAwesomeIcon icon="fas faCalendarXmark" classNames={["text-4xl", "text-base-content/40", "mb-4"]} />
                            <p className="text-base-content/60 text-lg">
                                {typeLabel} isn't currently scheduled for any Divisions.
                            </p>
                        </div>)}
                    {team && hasMeets && (
                        Object.entries(team.meets).map(([_meetId, { meet, hasScores }]) => (
                            <div key={`team_${meet.Id}`} className="pl-8">
                                <FontAwesomeIcon icon="fas faCalendar" />
                                <span className="pl-2 font-bold">
                                    {meet.NameOverride || meet.Name}:
                                </span>
                                <span className="pl-2">
                                    {hasScores ? "Scoring has started" : "No scores yet"}
                                </span>
                            </div>
                        )))}
                    {quizzer && hasMeets &&
                        Object.entries(quizzer.meets).map(([_meetId, { meet, teamName, hasScores }]) => (
                            <div key={`quizzer_${meet.Id}`} className="pl-8">
                                <FontAwesomeIcon icon="fas faCalendar" />
                                <span className="pl-2 font-bold">
                                    {meet.NameOverride || meet.Name}:
                                </span>
                                <span className="pl-2">
                                    {hasScores ? "Scoring has started" : "No scores yet"}
                                </span>
                                {teamName && (
                                    <p className="text-sm text-base-content/70">
                                        <FontAwesomeIcon icon="fas faUsers" />
                                        <span className="ml-2">Team: {teamName}</span>
                                    </p>)}
                            </div>))}
                </div>

                <div className="modal-action">
                    <button
                        type="button"
                        className="btn btn-primary mt-0"
                        onClick={handleClose}
                    >
                        Close
                    </button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={handleClose}>close</button>
            </form>
        </dialog>
    );
}