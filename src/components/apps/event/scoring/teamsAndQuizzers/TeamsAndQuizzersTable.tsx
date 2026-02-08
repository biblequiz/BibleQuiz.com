import { useState, useCallback } from "react";
import type { Team, Quizzer } from "types/Meets";
import type { OnlineTeamsAndQuizzersTeam, OnlineTeamsAndQuizzersQuizzer } from "types/services/AstroTeamsAndQuizzersService";
import FontAwesomeIcon from "components/FontAwesomeIcon";

interface Props {
    teams: Record<number, OnlineTeamsAndQuizzersTeam>;
    quizzers: Record<number, OnlineTeamsAndQuizzersQuizzer>;
    isReadOnly: boolean;
    isSaving: boolean;
    canDragQuizzer?: (quizzer: Quizzer) => boolean;
    onEditTeam: (team: Team) => void;
    onDeleteTeam: (team: Team) => void;
    onAddTeam: () => void;
    onEditQuizzer: (quizzer: Quizzer) => void;
    onDeleteQuizzer: (quizzer: Quizzer) => void;
    onAddQuizzer: (teamId: number) => void;
    onMoveQuizzer: (quizzerId: number, fromTeamId: number | undefined, toTeamId: number) => void;
    onShowTeamStats: (team: Team) => void;
    onShowQuizzerStats: (quizzer: Quizzer) => void;
    onSaveChanges: () => void;
    hasChanges: boolean;
}

export default function TeamsAndQuizzersTable({
    teams,
    quizzers,
    isReadOnly,
    isSaving,
    canDragQuizzer,
    onEditTeam,
    onDeleteTeam,
    onAddTeam,
    onEditQuizzer,
    onDeleteQuizzer,
    onAddQuizzer,
    onMoveQuizzer,
    onShowTeamStats,
    onShowQuizzerStats,
    onSaveChanges,
    hasChanges
}: Props) {

    const [showHidden, setShowHidden] = useState(false);
    const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());
    const [draggedQuizzerId, setDraggedQuizzerId] = useState<number | null>(null);
    const [dragOverTeamId, setDragOverTeamId] = useState<number | null>(null);

    // Get sorted teams
    const sortedTeams = Object.values(teams)
        .map(t => t.Team)
        .filter(t => showHidden || !t.IsHidden)
        .sort((a, b) => {
            const hiddenCompare = (a.IsHidden === b.IsHidden) ? 0 : a.IsHidden ? 1 : -1;
            if (hiddenCompare !== 0) return hiddenCompare;

            const leagueCompare = (a.League || "").localeCompare(b.League || "");
            if (leagueCompare !== 0) return leagueCompare;

            return a.Name.localeCompare(b.Name);
        });

    // Get quizzers for a specific team
    const getQuizzersForTeam = useCallback((teamId: number): Quizzer[] => {
        return Object.values(quizzers)
            .map(q => q.Quizzer)
            .filter(q => q.TeamId === teamId && (showHidden || !q.IsHidden))
            .sort((a, b) => {
                const hiddenCompare = (a.IsHidden === b.IsHidden) ? 0 : a.IsHidden ? 1 : -1;
                if (hiddenCompare !== 0) return hiddenCompare;

                return a.Name.localeCompare(b.Name);
            });
    }, [quizzers, showHidden]);

    const toggleTeamExpansion = (teamId: number) => {
        setExpandedTeams(prev => {
            const newSet = new Set(prev);
            if (newSet.has(teamId)) {
                newSet.delete(teamId);
            } else {
                newSet.add(teamId);
            }
            return newSet;
        });
    };

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, quizzer: Quizzer) => {
        if (canDragQuizzer && !canDragQuizzer(quizzer)) {
            e.preventDefault();
            return;
        }
        setDraggedQuizzerId(quizzer.Id);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", quizzer.Id.toString());
    };

    const handleDragEnd = () => {
        setDraggedQuizzerId(null);
        setDragOverTeamId(null);
    };

    const handleDragOver = (e: React.DragEvent, teamId: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverTeamId(teamId);
    };

    const handleDragLeave = () => {
        setDragOverTeamId(null);
    };

    const handleDrop = (e: React.DragEvent, targetTeamId: number) => {
        e.preventDefault();
        const quizzerId = parseInt(e.dataTransfer.getData("text/plain"), 10);

        if (!isNaN(quizzerId) && draggedQuizzerId !== null) {
            const quizzer = quizzers[quizzerId]?.Quizzer;
            if (quizzer && quizzer.TeamId !== targetTeamId) {
                onMoveQuizzer(quizzerId, quizzer.TeamId, targetTeamId);
            }
        }

        setDraggedQuizzerId(null);
        setDragOverTeamId(null);
    };

    const formatDate = (dateStr?: string): string => {
        if (!dateStr) return "";
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString();
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="space-y-2">
            {/* Header with Add Team button */}
            <div className="flex justify-between items-center mb-0 mt-0">
                <h3 className="text-lg font-semibold">Teams & Quizzers</h3>
                <div className="flex justify-right gap-2">
                    <label className="label cursor-pointer gap-2 mt-0">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={showHidden}
                            onChange={e => setShowHidden(e.target.checked)}
                            disabled={isSaving}
                        />
                        <span className="label-text text-sm">Show Hidden</span>
                    </label>
                    {!isReadOnly && (
                        <>
                            <button
                                type="button"
                                className="btn btn-success btn-sm mt-0"
                                onClick={onSaveChanges}
                                disabled={!hasChanges || isSaving}
                            >
                                <FontAwesomeIcon icon="fas faSave" />
                                Save Changes
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary btn-sm mt-0"
                                onClick={onAddTeam}
                                disabled={isSaving}
                            >
                                <FontAwesomeIcon icon="fas faPlus" />
                                Add Team
                            </button>
                        </>)}
                </div>
            </div>

            {/* Teams table */}
            {sortedTeams.length === 0 ? (
                <div className="alert alert-info">
                    <FontAwesomeIcon icon="fas faInfoCircle" />
                    <span>No teams found. Click "Add Team" to create one.</span>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full text-sm">
                        <thead>
                            <tr>
                                <th className="w-8"></th>
                                <th className="w-16">League</th>
                                <th>Name</th>
                                <th>Church</th>
                                <th className="w-32 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedTeams.map(team => {
                                const isExpanded = expandedTeams.has(team.Id);
                                const teamQuizzers = getQuizzersForTeam(team.Id);
                                const isDragOver = dragOverTeamId === team.Id;

                                return (
                                    <TeamRow
                                        key={team.Id}
                                        team={team}
                                        isExpanded={isExpanded}
                                        isReadOnly={isReadOnly}
                                        disabled={isSaving}
                                        quizzers={teamQuizzers}
                                        isDragOver={isDragOver}
                                        draggedQuizzerId={draggedQuizzerId}
                                        canDragQuizzer={canDragQuizzer}
                                        onToggleExpand={() => toggleTeamExpansion(team.Id)}
                                        onEdit={() => onEditTeam(team)}
                                        onDelete={() => onDeleteTeam(team)}
                                        onShowStats={() => onShowTeamStats(team)}
                                        onAddQuizzer={() => onAddQuizzer(team.Id)}
                                        onEditQuizzer={onEditQuizzer}
                                        onDeleteQuizzer={onDeleteQuizzer}
                                        onShowQuizzerStats={onShowQuizzerStats}
                                        onDragStart={handleDragStart}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => handleDragOver(e, team.Id)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, team.Id)}
                                        formatDate={formatDate}
                                    />
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

interface TeamRowProps {
    team: Team;
    isExpanded: boolean;
    quizzers: Quizzer[];
    isDragOver: boolean;
    draggedQuizzerId: number | null;
    isReadOnly: boolean;
    disabled: boolean;
    canDragQuizzer?: (quizzer: Quizzer) => boolean;
    onToggleExpand: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onShowStats: () => void;
    onAddQuizzer: () => void;
    onEditQuizzer: (quizzer: Quizzer) => void;
    onDeleteQuizzer: (quizzer: Quizzer) => void;
    onShowQuizzerStats: (quizzer: Quizzer) => void;
    onDragStart: (e: React.DragEvent, quizzer: Quizzer) => void;
    onDragEnd: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    formatDate: (dateStr?: string) => string;
}

function TeamRow({
    team,
    isExpanded,
    quizzers,
    isDragOver,
    draggedQuizzerId,
    isReadOnly,
    disabled,
    canDragQuizzer,
    onToggleExpand,
    onEdit,
    onDelete,
    onShowStats,
    onAddQuizzer,
    onEditQuizzer,
    onDeleteQuizzer,
    onShowQuizzerStats,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
    formatDate
}: TeamRowProps) {
    return (
        <>
            {/* Team row */}
            <tr
                className={`cursor-pointer hover ${isDragOver ? "bg-primary/20" : ""} ${team.IsHidden ? "opacity-50" : ""}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <td>
                    <button
                        type="button"
                        className="btn btn-outline btn-xs w-8"
                        onClick={onToggleExpand}
                    >
                        <FontAwesomeIcon
                            icon={isExpanded ? "fas faChevronDown" : "fas faChevronRight"}
                            classNames={["w-auto"]} />
                    </button>
                </td>
                <td className="text-center font-mono">
                    {team.League || "-"}
                </td>
                <td onClick={onToggleExpand}>
                    <span className="font-medium">{team.Name}</span>
                    {team.IsHidden && (
                        <span className="badge badge-ghost badge-sm ml-2">Hidden</span>
                    )}
                    <span className="badge badge-info badge-sm ml-2">
                        <FontAwesomeIcon icon="fas faPerson" classNames={["mr-1"]} />
                        {quizzers.length}
                    </span>
                </td>
                <td>{team.Church || "-"}</td>
                <td>
                    <div className="flex justify-center gap-1">
                        {!isReadOnly && (
                            <button
                                type="button"
                                className="btn btn-outline btn-xs"
                                onClick={onAddQuizzer}
                            >
                                <FontAwesomeIcon icon="fas faPlus" />
                            </button>)}
                        <button
                            type="button"
                            className="btn btn-ghost btn-xs mt-0"
                            onClick={onShowStats}
                            title="View Statistics"
                            disabled={disabled}
                        >
                            <FontAwesomeIcon icon="fas faChartBar" />
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost btn-xs mt-0"
                            onClick={onEdit}
                            title="Edit Team"
                            disabled={disabled}
                        >
                            <FontAwesomeIcon icon="fas faPencil" />
                        </button>
                        {!isReadOnly && (
                            <button
                                type="button"
                                className="btn btn-ghost btn-xs text-error mt-0"
                                onClick={onDelete}
                                title="Delete Team"
                                disabled={disabled}
                            >
                                <FontAwesomeIcon icon="fas faTrash" />
                            </button>)}
                    </div>
                </td>
            </tr>

            {/* Expanded quizzers section */}
            {isExpanded && (
                <tr>
                    <td colSpan={5} className="bg-base-200 p-0">
                        <div className="p-0 pl-16 mt-0">
                            {quizzers.length === 0 ? (
                                <p className="text-sm text-base-content/60 italic">
                                    No quizzers on this team.
                                </p>
                            ) : (
                                <table className="table table-sm w-full">
                                    <thead>
                                        <tr>
                                            <th className="w-8"></th>
                                            <th>Name</th>
                                            <th>Years Quizzing</th>
                                            <th>Date of Birth</th>
                                            <th className="w-32 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {quizzers.map(quizzer => {
                                            const isDraggable = !canDragQuizzer || canDragQuizzer(quizzer);
                                            const isDragging = draggedQuizzerId === quizzer.Id;

                                            return (
                                                <tr
                                                    key={quizzer.Id}
                                                    className={`${quizzer.IsHidden ? "opacity-50" : ""} ${isDragging ? "opacity-30" : ""}`}
                                                    draggable={isDraggable}
                                                    onDragStart={(e) => onDragStart(e, quizzer)}
                                                    onDragEnd={onDragEnd}
                                                >
                                                    <td>
                                                        {isDraggable ? (
                                                            <FontAwesomeIcon
                                                                icon="fas faGripVertical"
                                                                classNames={["cursor-grab", "text-base-content/40"]}
                                                            />
                                                        ) : (
                                                            <span title="Cannot move - has scores in meets">
                                                                <FontAwesomeIcon
                                                                    icon="fas faLock"
                                                                    classNames={["text-warning/60"]}
                                                                />
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {quizzer.Name}
                                                        {quizzer.IsHidden && (
                                                            <span className="badge badge-ghost badge-sm ml-2">Hidden</span>
                                                        )}
                                                    </td>
                                                    <td>{quizzer.YearsQuizzing ?? "None"}</td>
                                                    <td>{quizzer.DateOfBirth ? formatDate(quizzer.DateOfBirth) : "None"}</td>
                                                    <td>
                                                        <div className="flex justify-center gap-1">
                                                            <button
                                                                type="button"
                                                                className="btn btn-ghost btn-xs mt-0"
                                                                onClick={() => onShowQuizzerStats(quizzer)}
                                                                title="View Statistics"
                                                            >
                                                                <FontAwesomeIcon icon="fas faChartBar" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-ghost btn-xs mt-0"
                                                                onClick={() => onEditQuizzer(quizzer)}
                                                                title="Edit Quizzer"
                                                            >
                                                                <FontAwesomeIcon icon="fas faPencil" />
                                                            </button>
                                                            {!isReadOnly && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-ghost btn-xs text-error mt-0"
                                                                    onClick={() => onDeleteQuizzer(quizzer)}
                                                                    title="Delete Quizzer"
                                                                >
                                                                    <FontAwesomeIcon icon="fas faTrash" />
                                                                </button>)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}