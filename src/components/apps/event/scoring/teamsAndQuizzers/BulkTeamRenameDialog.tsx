import { useRef, useState, useEffect, useCallback } from "react";
import { Team } from "types/Meets";
import FontAwesomeIcon from "components/FontAwesomeIcon";

interface Props {
    teams: Team[];
    onSave: (renamedTeams: Team[]) => void;
    onCancel: () => void;
}

type DataTagId = 'churchName' | 'city' | 'state' | 'teamName';
type SeparatorTagId = 'colon' | 'comma' | 'dash' | 'openParen' | 'closeParen';
type TagId = DataTagId | SeparatorTagId;

interface DataTagConfig {
    id: DataTagId;
    label: string;
    type: 'data';
    getValue: (team: Team) => string;
}

interface SeparatorTagConfig {
    id: SeparatorTagId;
    label: string;
    type: 'separator';
    char: string;
    spaceBefore: boolean;
    spaceAfter: boolean;
}

type TagConfig = DataTagConfig | SeparatorTagConfig;

const DATA_TAGS: DataTagConfig[] = [
    { id: 'churchName', label: 'Church Name', type: 'data', getValue: (team) => team.Church || '' },
    { id: 'city', label: 'City', type: 'data', getValue: (team) => team.City || '' },
    { id: 'state', label: 'State', type: 'data', getValue: (team) => team.State || '' },
    { id: 'teamName', label: 'Team Name', type: 'data', getValue: (team) => team.Name || '' },
];

const SEPARATOR_TAGS: SeparatorTagConfig[] = [
    { id: 'colon', label: ':', type: 'separator', char: ':', spaceBefore: false, spaceAfter: true },
    { id: 'comma', label: ',', type: 'separator', char: ',', spaceBefore: false, spaceAfter: true },
    { id: 'dash', label: '-', type: 'separator', char: '-', spaceBefore: true, spaceAfter: true },
    { id: 'openParen', label: '(', type: 'separator', char: '(', spaceBefore: true, spaceAfter: false },
    { id: 'closeParen', label: ')', type: 'separator', char: ')', spaceBefore: false, spaceAfter: true },
];

const ALL_TAGS: TagConfig[] = [...DATA_TAGS, ...SEPARATOR_TAGS];

interface SelectedTag {
    id: TagId;
    instanceId: number; // Unique instance ID to allow multiple separators
}

interface TeamPreview {
    team: Team;
    finalName: string;
    finalChurch: string;
}

let nextInstanceId = 0;

export default function BulkTeamRenameDialog({ teams, onSave, onCancel }: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    // Filter out hidden teams
    const visibleTeams = teams.filter(t => !t.IsHidden);

    // State for tag configuration
    const [selectedTags, setSelectedTags] = useState<SelectedTag[]>([]);
    const [draggedTagIndex, setDraggedTagIndex] = useState<number | null>(null);

    // State for team previews
    const [teamPreviews, setTeamPreviews] = useState<TeamPreview[]>([]);
    const [draggedTeamIndex, setDraggedTeamIndex] = useState<number | null>(null);
    const [dragOverTeamIndex, setDragOverTeamIndex] = useState<number | null>(null);

    // Initialize team previews with current values
    useEffect(() => {
        const previews = visibleTeams
            .sort((a, b) => a.Id - b.Id)
            .map(team => ({
                team,
                finalName: team.Name,
                finalChurch: team.Church || '',
            }));
        setTeamPreviews(previews);
    }, []);

    // Get tag config by id
    const getTagConfig = useCallback((id: TagId): TagConfig | undefined => {
        return ALL_TAGS.find(t => t.id === id);
    }, []);

    // Generate name from tags
    const generateNameFromTags = useCallback((team: Team, tags: SelectedTag[]): string => {
        if (tags.length === 0) return team.Name;

        let result: string[] = [];
        let lastWasData = false;

        for (const tag of tags) {
            const config = getTagConfig(tag.id);
            if (!config) continue;

            if (config.type === 'data') {
                const value = config.getValue(team);
                if (value) {
                    // Add space between consecutive data tags
                    if (lastWasData && result.length > 0) {
                        result.push(' ');
                    }
                    result.push(value);
                    lastWasData = true;
                }
            } else {
                // Separator
                if (config.spaceBefore && result.length > 0 && result[result.length - 1] !== ' ') {
                    result.push(' ');
                }
                result.push(config.char);
                if (config.spaceAfter) {
                    result.push(' ');
                }
                lastWasData = false;
            }
        }

        return result.join('').trim() || team.Name;
    }, [getTagConfig]);

    // Apply naming scheme to all teams
    const applyNamingScheme = useCallback(() => {
        if (selectedTags.length === 0) return;

        // Generate initial names based on current teamPreviews order
        const generatedNames: { teamId: number; name: string; orderIndex: number }[] = teamPreviews.map((preview, index) => ({
            teamId: preview.team.Id,
            name: generateNameFromTags(preview.team, selectedTags),
            orderIndex: index,
        }));

        // Find duplicates and add suffixes based on order in the table
        const nameCounts: Record<string, { teamId: number; orderIndex: number }[]> = {};
        generatedNames.forEach(item => {
            if (!nameCounts[item.name]) {
                nameCounts[item.name] = [];
            }
            nameCounts[item.name].push({ teamId: item.teamId, orderIndex: item.orderIndex });
        });

        // Sort duplicate teams by their order index and assign suffixes
        const finalNames: Record<number, string> = {};
        Object.entries(nameCounts).forEach(([name, teams]) => {
            if (teams.length === 1) {
                finalNames[teams[0].teamId] = name;
            } else {
                // Sort by order index (position in table) and add suffix
                teams.sort((a, b) => a.orderIndex - b.orderIndex);
                teams.forEach((team, index) => {
                    finalNames[team.teamId] = `${name} #${index + 1}`;
                });
            }
        });

        // Update previews
        setTeamPreviews(prev => prev.map(preview => ({
            ...preview,
            finalName: finalNames[preview.team.Id] || preview.team.Name,
        })));
    }, [selectedTags, teamPreviews, generateNameFromTags]);

    // Reset to original names
    const handleResetToOriginal = () => {
        setTeamPreviews(prev => prev.map(preview => ({
            ...preview,
            finalName: preview.team.OriginalName || preview.team.Name,
            finalChurch: preview.team.OriginalChurchName || preview.team.Church || '',
        })));
    };

    // Add tag to scheme
    const handleAddTag = (tagId: TagId) => {
        const config = getTagConfig(tagId);
        if (!config) return;

        // Data tags can only be added once, separators can be added multiple times
        if (config.type === 'data' && selectedTags.some(t => t.id === tagId)) {
            return;
        }

        // If adding a data tag and there's already at least one tag, auto-add a comma separator first
        // But only if the last tag is not already a separator
        if (config.type === 'data' && selectedTags.length > 0) {
            const lastTag = selectedTags[selectedTags.length - 1];
            const lastTagConfig = getTagConfig(lastTag.id);
            const lastTagIsSeparator = lastTagConfig?.type === 'separator';

            if (lastTagIsSeparator) {
                // Last tag is a separator, just add the data tag
                setSelectedTags([...selectedTags, { id: tagId, instanceId: nextInstanceId++ }]);
            } else {
                // Last tag is data, add comma then data tag
                setSelectedTags([
                    ...selectedTags,
                    { id: 'comma', instanceId: nextInstanceId++ },
                    { id: tagId, instanceId: nextInstanceId++ }
                ]);
            }
        } else {
            setSelectedTags([...selectedTags, { id: tagId, instanceId: nextInstanceId++ }]);
        }
    };

    // Remove tag from scheme
    const handleRemoveTag = (instanceId: number) => {
        setSelectedTags(selectedTags.filter(t => t.instanceId !== instanceId));
    };

    // Drag and drop for reordering tags
    const handleTagDragStart = (index: number) => {
        setDraggedTagIndex(index);
    };

    const handleTagDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedTagIndex === null || draggedTagIndex === index) return;

        const newTags = [...selectedTags];
        const draggedTag = newTags[draggedTagIndex];
        newTags.splice(draggedTagIndex, 1);
        newTags.splice(index, 0, draggedTag);
        setSelectedTags(newTags);
        setDraggedTagIndex(index);
    };

    const handleTagDragEnd = () => {
        setDraggedTagIndex(null);
    };

    // Drag and drop for reordering teams
    const handleTeamDragStart = (index: number) => {
        setDraggedTeamIndex(index);
    };

    const handleTeamDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedTeamIndex === null || draggedTeamIndex === index) return;
        setDragOverTeamIndex(index);
    };

    const handleTeamDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedTeamIndex === null || draggedTeamIndex === index) {
            setDraggedTeamIndex(null);
            setDragOverTeamIndex(null);
            return;
        }

        const newPreviews = [...teamPreviews];
        const draggedPreview = newPreviews[draggedTeamIndex];
        newPreviews.splice(draggedTeamIndex, 1);
        newPreviews.splice(index, 0, draggedPreview);
        setTeamPreviews(newPreviews);
        setDraggedTeamIndex(null);
        setDragOverTeamIndex(null);
    };

    const handleTeamDragEnd = () => {
        setDraggedTeamIndex(null);
        setDragOverTeamIndex(null);
    };

    // Update individual team preview
    const handleNameChange = (teamId: number, newName: string) => {
        setTeamPreviews(prev => prev.map(preview =>
            preview.team.Id === teamId
                ? { ...preview, finalName: newName }
                : preview
        ));
    };

    const handleChurchChange = (teamId: number, newChurch: string) => {
        setTeamPreviews(prev => prev.map(preview =>
            preview.team.Id === teamId
                ? { ...preview, finalChurch: newChurch }
                : preview
        ));
    };

    // Save changes
    const handleSave = () => {
        const renamedTeams = teamPreviews.map(preview => {
            const newValue = { ...preview.team };
            if (!newValue.OriginalName) {
                newValue.OriginalName = newValue.Name;
            }

            if (!newValue.OriginalChurchName) {
                newValue.OriginalChurchName = newValue.Church;
            }

            newValue.Name = preview.finalName.trim();
            newValue.Church = preview.finalChurch.trim();

            return newValue;
        });

        onSave(renamedTeams);
        dialogRef.current?.close();
    };

    const handleClose = () => {
        onCancel();
        dialogRef.current?.close();
    };

    // Get available data tags (not yet selected)
    const availableDataTags = DATA_TAGS.filter(t => !selectedTags.some(st => st.id === t.id));

    return (
        <dialog ref={dialogRef} className="modal" onClose={handleClose} open>
            <div className="modal-box w-full max-w-5xl max-h-[90vh]">
                <h3 className="font-bold text-lg">Bulk Rename Teams</h3>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 mt-0"
                    onClick={handleClose}
                >
                    ✕
                </button>

                <div className="mt-4 space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {availableDataTags.map(tag => (
                            <button
                                key={tag.id}
                                type="button"
                                className="btn btn-sm btn-outline btn-primary mt-0"
                                onClick={() => handleAddTag(tag.id)}
                            >
                                <FontAwesomeIcon icon="fas faPlus" />
                                {tag.label}
                            </button>
                        ))}
                        {SEPARATOR_TAGS.map(tag => (
                            <button
                                key={tag.id}
                                type="button"
                                className="btn btn-sm btn-outline btn-secondary mt-0"
                                onClick={() => handleAddTag(tag.id)}
                            >
                                <FontAwesomeIcon icon="fas faPlus" />
                                {tag.label}
                            </button>
                        ))}
                    </div>

                    <div className="border border-base-500 rounded-lg p-3">
                        <div className="flex flex-wrap items-center gap-2">
                            {selectedTags.length === 0 ? (
                                <span className="text-sm text-base-content/60 italic">
                                    Click tags above to build naming scheme
                                </span>
                            ) : (
                                <>
                                    {selectedTags.map((tag, index) => {
                                        const config = getTagConfig(tag.id);
                                        const isDataTag = config?.type === 'data';
                                        return (
                                            <div
                                                key={tag.instanceId}
                                                className={`badge badge-lg gap-1 cursor-move ${isDataTag ? 'badge-primary' : 'badge-secondary'} text-sm mt-0`}
                                                draggable
                                                onDragStart={() => handleTagDragStart(index)}
                                                onDragOver={(e) => handleTagDragOver(e, index)}
                                                onDragEnd={handleTagDragEnd}
                                            >
                                                <FontAwesomeIcon icon="fas faGripVertical" classNames={["text-xs"]} />
                                                {config?.label}
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost btn-xs p-0 ml-1 mt-0 cursor-pointer mt-0"
                                                    onClick={() => handleRemoveTag(tag.instanceId)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        );
                                    })}
                                </>)}
                        </div>
                        <p className="text-xs text-base-content/50 mt-2">
                            <FontAwesomeIcon icon="fas faArrowsUpDownLeftRight" classNames={["mr-1"]} />
                            Drag and drop tags to reorder
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center mb-0">
                        <button
                            type="button"
                            className="btn btn-sm btn-info mt-0"
                            onClick={applyNamingScheme}
                            disabled={selectedTags.length === 0}
                        >
                            <FontAwesomeIcon icon="fas faWandMagicSparkles" />
                            Apply Scheme
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-warning mt-0"
                            onClick={handleResetToOriginal}
                        >
                            <FontAwesomeIcon icon="fas faRotateLeft" />
                            Reset to Original Names
                        </button>
                        <div className="text-xs text-base-content/50 mb-0 mt-0">
                            <FontAwesomeIcon icon="fas faArrowsUpDownLeftRight" classNames={["mr-1"]} />
                            Drag rows to reorder teams (affects #N numbering)
                        </div>
                    </div>

                    {/* Teams Preview Table */}
                    <div className="divider mt-2 mb-2"></div>
                    <div className="overflow-auto max-h-64 -webkit-overflow-scrolling-touch border border-base-300 rounded-lg">
                        <table className="table table-zebra table-sm w-full">
                            <thead className="bg-base-200">
                                <tr>
                                    <th className="w-8"></th>
                                    <th>Original Name</th>
                                    <th>Original Church</th>
                                    <th>Final Name</th>
                                    <th>Final Church</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teamPreviews.map((preview, index) => (
                                    <tr
                                        key={preview.team.Id}
                                        draggable
                                        onDragStart={() => handleTeamDragStart(index)}
                                        onDragOver={(e) => handleTeamDragOver(e, index)}
                                        onDrop={(e) => handleTeamDrop(e, index)}
                                        onDragEnd={handleTeamDragEnd}
                                        className={`${draggedTeamIndex === index ? 'opacity-50' : ''} ${dragOverTeamIndex === index ? 'bg-primary/20' : ''}`}
                                    >
                                        <td>
                                            <FontAwesomeIcon
                                                icon="fas faGripVertical"
                                                classNames={["cursor-grab", "text-base-content/40"]}
                                            />
                                        </td>
                                        <td className="text-base-content/70">
                                            {preview.team.OriginalName || preview.team.Name}
                                        </td>
                                        <td className="text-base-content/70">
                                            {preview.team.OriginalChurchName || preview.team.Church || '-'}
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="input input-bordered input-sm w-full"
                                                value={preview.finalName}
                                                onChange={(e) => handleNameChange(preview.team.Id, e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="input input-bordered input-sm w-full"
                                                value={preview.finalChurch}
                                                onChange={(e) => handleChurchChange(preview.team.Id, e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="modal-action mt-4">
                    <button
                        type="button"
                        className="btn btn-sm btn-primary mt-0"
                        onClick={handleSave}
                    >
                        <FontAwesomeIcon icon="fas faSave" />
                        Apply
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-secondary mt-0"
                        onClick={handleClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={handleClose}>Close</button>
            </form>
        </dialog>);
}