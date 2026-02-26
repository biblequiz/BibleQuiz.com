import { useRef, useState, useEffect, useCallback } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import CollapsibleSection from "components/CollapsibleSection";
import type { AuthManager } from "types/AuthManager";
import type { OnlineDatabaseSummary, OnlineDatabaseMeetSummary } from "types/services/AstroDatabasesService";
import { AstroDatabasesService } from "types/services/AstroDatabasesService";
import {
    AstroMeetsService,
    type OnlineMeetSettings,
    type OnlineMeetSchedulingSettings,
    type OnlineMeetSchedulePreview
} from "types/services/AstroMeetsService";
import type { TeamOrQuizzerReference } from "types/Meets";
import type { MatchRules } from "types/MatchRules";
import { MatchRules as MatchRulesClass } from "types/MatchRules";
import type { ScheduleTemplate } from "types/Scheduling";
import LinkedMeetsDialog from "./LinkedMeetsDialog";
import MatchRulesDialog from "../../rules/MatchRulesDialog";
import TeamSelector from "./TeamSelector";
import RoomEditor, { generateRoomNamesForCount } from "./RoomEditor";
import SchedulePreviewTable from "./SchedulePreviewTable";
import CustomScheduleUploader from "./CustomScheduleUploader";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

interface Props {
    auth: AuthManager;
    eventId: string;
    eventType: string;
    databaseId: string;
    meetId: number;
    meetName: string;
    allMeets: OnlineDatabaseMeetSummary[];
    defaultRules: MatchRules;
    defaultMatchStartTime: string;
    isScoreKeepDatabase: boolean;
    isNew: boolean;
    onSave: (updatedDatabase: OnlineDatabaseSummary) => void;
    onClose: () => void;
}

export default function DivisionScheduleDialog({
    auth,
    eventId,
    eventType,
    databaseId,
    meetId,
    meetName,
    allMeets,
    defaultRules,
    defaultMatchStartTime,
    isScoreKeepDatabase,
    isNew,
    onSave,
    onClose
}: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    // Loading/saving state
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isRefreshingPreview, setIsRefreshingPreview] = useState(false);
    const [isUploadingSchedule, setIsUploadingSchedule] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Meet settings
    const [settings, setSettings] = useState<OnlineMeetSettings | null>(null);
    const [schedulePreview, setSchedulePreview] = useState<OnlineMeetSchedulePreview | null>(null);
    const [hasOriginalSchedule, setHasOriginalSchedule] = useState(isNew);
    const [isScheduleOutOfDate, setIsScheduleOutOfDate] = useState(isNew);

    // Form state
    const [name, setName] = useState(meetName);
    const [roomNames, setRoomNames] = useState<string[]>([]);
    const [matchLengthInMinutes, setMatchLengthInMinutes] = useState(20);
    const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
    const [linkedMeetIds, setLinkedMeetIds] = useState<number[]>([]);
    const [includeByesInScores, setIncludeByesInScores] = useState(false);
    const [startingRoundOverride, setStartingRoundOverride] = useState<number | null>(null);
    const [roundCountOverride, setRoundCountOverride] = useState<number | null>(null);

    // Custom schedule state
    const [hasCustomSchedule, setHasCustomSchedule] = useState(false);
    const [customSchedule, setCustomSchedule] = useState<ScheduleTemplate | null>(null);
    const [isRemovingCustomSchedule, setIsRemovingCustomSchedule] = useState(false);

    // Custom rules state
    const [useCustomRules, setUseCustomRules] = useState(false);
    const [customRules, setCustomRules] = useState<MatchRules | null>(null);
    const [isEditingRules, setIsEditingRules] = useState(false);

    // Optimizer state
    const [useOptimizer, setUseOptimizer] = useState(false);

    // Match times state - tracks the time for each match (key = matchId, value = TimeSpan string)
    const [matchTimes, setMatchTimes] = useState<Record<number, string | null>>({});
    // Track the previous match length to detect changes
    const [prevMatchLengthInMinutes, setPrevMatchLengthInMinutes] = useState<number | null>(null);

    // Dialog state
    const [showLinkedMeetsDialog, setShowLinkedMeetsDialog] = useState(false);

    // All available teams from the database
    const [allTeams, setAllTeams] = useState<Record<number, TeamOrQuizzerReference>>({});

    // Meets with scores - used to determine if scoring has started
    const [meetsWithScores, setMeetsWithScores] = useState<number[]>([]);

    // Derived permissions based on database type and scoring status
    const hasScoringStarted = !isNew && meetsWithScores.includes(meetId);
    const canEditName = !isSaving;
    const canEditRoomNames = !isScoreKeepDatabase && !hasScoringStarted && !isSaving;
    const canEditScheduleSettings = !isScoreKeepDatabase && !hasScoringStarted && !isSaving;
    // For LinkedMeetsDialog - show divisions but don't allow changes if ScoreKeep or scoring started
    const isLinkedMeetsReadOnly = isScoreKeepDatabase || hasScoringStarted;

    // Load meet settings on mount (call getMeet with 0 for new divisions to get defaults)
    useEffect(() => {
        setIsLoading(true);
        setError(null);

        const meetIdToLoad = isNew ? 0 : meetId;

        AstroMeetsService.getMeet(auth, eventId, databaseId, meetIdToLoad)
            .then(data => {
                setSettings(data);

                if (!isNew) {
                    setName(data.Name);
                }

                setRoomNames(data.RoomNames || []);
                setMatchLengthInMinutes(data.MatchLengthInMinutes || 20);
                setAllTeams(data.AllTeams || {});

                // Custom rules
                if (data.CustomRules) {
                    setUseCustomRules(true);
                    setCustomRules(data.CustomRules);
                }

                if (data.Schedule) {
                    if (!isNew) {
                        setSelectedTeamIds(data.Schedule.TeamIds || []);
                        setLinkedMeetIds(data.Schedule.LinkedMeetIds || []);
                        setIncludeByesInScores(data.Schedule.IncludeByesInScores || false);
                        setStartingRoundOverride(data.Schedule.StartingTemplateRoundOverride || null);
                        setRoundCountOverride(data.Schedule.TemplateRoundCountOverride || null);
                    }

                    // Custom schedule from server
                    const hasCustom = data.Schedule.HasCustomSchedule || false;
                    setHasCustomSchedule(hasCustom);

                    // Use optimizer
                    if (data.Schedule.UseOptimizer) {
                        setUseOptimizer(true);
                    }
                }

                if (data.Preview && !isNew) {
                    setSchedulePreview(data.Preview);
                    setIsScheduleOutOfDate(false);
                    setHasOriginalSchedule(true);

                    // Initialize match times from the preview
                    const initialMatchTimes: Record<number, string | null> = {};
                    let lastMatchTime = defaultMatchStartTime;
                    for (const [matchId, match] of Object.entries(data.Preview.Matches)) {
                        initialMatchTimes[Number(matchId)] = match.MatchTime ?? lastMatchTime ?? null;
                        if (match.MatchTime && lastMatchTime != match.MatchTime) {
                            lastMatchTime = match.MatchTime;
                        }
                    }
                    setMatchTimes(initialMatchTimes);
                }

                // Store which meets have scores
                setMeetsWithScores(data.AllMeetsWithScores || []);

                // Store the initial match length for comparison
                setPrevMatchLengthInMinutes(data.MatchLengthInMinutes || 20);

                setIsLoading(false);
            })
            .catch(err => {
                setError(err.message || "Failed to load division settings.");
                setIsLoading(false);
            });
    }, [auth, eventId, databaseId, meetId, isNew]);

    // Sync room count with schedule preview
    useEffect(() => {
        if (schedulePreview && schedulePreview.RoomCount > 0) {
            const requiredRooms = schedulePreview.RoomCount;
            if (roomNames.length !== requiredRooms) {
                const newRooms = generateRoomNamesForCount(roomNames, requiredRooms);
                setRoomNames(newRooms);
            }
        }
    }, [schedulePreview?.RoomCount, roomNames.length]);

    /**
     * Calculate expected match time for a given match index based on first match time and match length.
     */
    const calculateExpectedMatchTime = useCallback((matchIndex: number, firstMatchTime: string | null, lengthInMinutes: number): string | null => {
        if (!firstMatchTime) return null;
        const parsed = DataTypeHelpers.parseTimeSpan(firstMatchTime);
        if (!parsed) return null;

        const totalMinutes = (parsed.days * 24 * 60) + (parsed.hours * 60) + parsed.minutes + (matchIndex * lengthInMinutes);
        const days = Math.floor(totalMinutes / (24 * 60));
        const remainingMinutes = totalMinutes % (24 * 60);
        const hours = Math.floor(remainingMinutes / 60);
        const minutes = remainingMinutes % 60;

        return DataTypeHelpers.formatTimeSpan(hours, minutes, 0, days);
    }, []);

    /**
     * Check if all match times follow the expected pattern based on the match length.
     */
    const areMatchTimesFollowingPattern = useCallback((times: Record<number, string | null>, lengthInMinutes: number): boolean => {
        const matchIds = Object.keys(times).map(Number).sort((a, b) => a - b);
        if (matchIds.length === 0) return true;

        const firstMatchTime = times[matchIds[0]];
        if (!firstMatchTime) return true; // If no times set, consider as following pattern

        for (let i = 1; i < matchIds.length; i++) {
            const expectedTime = calculateExpectedMatchTime(i, firstMatchTime, lengthInMinutes);
            const actualTime = times[matchIds[i]];

            // Compare normalized time strings
            if (expectedTime !== actualTime) {
                // Also check if both are effectively the same time (compare parsed values)
                const expectedParsed = DataTypeHelpers.parseTimeSpan(expectedTime);
                const actualParsed = DataTypeHelpers.parseTimeSpan(actualTime);

                if (!expectedParsed || !actualParsed) return false;

                const expectedMinutes = (expectedParsed.days * 24 * 60) + (expectedParsed.hours * 60) + expectedParsed.minutes;
                const actualMinutes = (actualParsed.days * 24 * 60) + (actualParsed.hours * 60) + actualParsed.minutes;

                if (expectedMinutes !== actualMinutes) return false;
            }
        }
        return true;
    }, [calculateExpectedMatchTime]);

    /**
     * Handle match length change - recalculate times only if they were following the old pattern.
     */
    useEffect(() => {
        if (prevMatchLengthInMinutes === null || prevMatchLengthInMinutes === matchLengthInMinutes) {
            return;
        }

        // Check if match times were following the pattern with the OLD match length
        if (areMatchTimesFollowingPattern(matchTimes, prevMatchLengthInMinutes)) {
            // Recalculate with new match length
            const matchIds = Object.keys(matchTimes).map(Number).sort((a, b) => a - b);
            if (matchIds.length > 0) {
                const firstMatchTime = matchTimes[matchIds[0]];
                const newMatchTimes: Record<number, string | null> = {};

                for (let i = 0; i < matchIds.length; i++) {
                    if (i === 0) {
                        newMatchTimes[matchIds[i]] = firstMatchTime;
                    } else {
                        newMatchTimes[matchIds[i]] = calculateExpectedMatchTime(i, firstMatchTime, matchLengthInMinutes);
                    }
                }

                setMatchTimes(newMatchTimes);
            }
        }

        setPrevMatchLengthInMinutes(matchLengthInMinutes);
    }, [matchLengthInMinutes, prevMatchLengthInMinutes, matchTimes, areMatchTimesFollowingPattern, calculateExpectedMatchTime]);

    // Mark schedule as out of date when settings change
    const markScheduleOutOfDate = () => {
        setIsScheduleOutOfDate(true);
        setHasOriginalSchedule(false);
    };

    // Handle scheduling settings changes
    const handleTeamIdsChange = (newTeamIds: number[]) => {
        setSelectedTeamIds(newTeamIds);
        markScheduleOutOfDate();
    };

    const handleLinkedMeetsSave = (newLinkedMeetIds: number[]) => {
        setLinkedMeetIds(newLinkedMeetIds);
        setShowLinkedMeetsDialog(false);
        markScheduleOutOfDate();
    };

    const handleIncludeByesChange = (value: boolean) => {
        setIncludeByesInScores(value);
        markScheduleOutOfDate();
    };

    const handleStartingRoundChange = (value: string) => {
        const parsed = parseInt(value, 10);
        setStartingRoundOverride(isNaN(parsed) || parsed < 1 ? null : parsed);
        markScheduleOutOfDate();
    };

    const handleRoundCountChange = (value: string) => {
        if (value === "" || value === "default") {
            setRoundCountOverride(null);
        } else {
            const parsed = parseInt(value, 10);
            setRoundCountOverride(isNaN(parsed) || parsed < 1 ? null : parsed);
        }
        markScheduleOutOfDate();
    };

    // Build scheduling settings object (reused across multiple operations)
    const getSchedulingSettings = (): OnlineMeetSchedulingSettings => ({
        LinkedMeetIds: linkedMeetIds,
        TeamIds: selectedTeamIds,
        IncludeByesInScores: includeByesInScores,
        HasCustomSchedule: hasCustomSchedule && !isRemovingCustomSchedule,
        IsScheduleChanged: true,
        CustomSchedule: isRemovingCustomSchedule ? null : customSchedule,
        OptimizedSchedule: null,
        StartingTemplateRoundOverride: startingRoundOverride,
        TemplateRoundCountOverride: roundCountOverride,
        UseOptimizer: useOptimizer
    });

    // Custom schedule handlers
    const handleUploadSchedule = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingSchedule(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const template = await AstroDatabasesService.parseScheduleTemplate(
                auth,
                eventId,
                databaseId,
                formData
            );

            setCustomSchedule(template);
            setHasCustomSchedule(true);
            setIsRemovingCustomSchedule(false);
            markScheduleOutOfDate();
        } catch (err: any) {
            setError(err.message || "Failed to parse schedule file.");
        } finally {
            setIsUploadingSchedule(false);
        }
    };

    const handleRemoveCustomSchedule = () => {
        setCustomSchedule(null);
        setIsRemovingCustomSchedule(true);
        setHasCustomSchedule(false);
        markScheduleOutOfDate();
    };

    // Custom rules handlers
    const handleCustomRulesChange = (checked: boolean) => {
        setUseCustomRules(checked);
        if (!checked) {
            setCustomRules(null);
        }
    };

    const handleRulesDialogClose = (newRules: MatchRules | null) => {
        setIsEditingRules(false);
        if (newRules) {
            setCustomRules(newRules);
        }
    };

    /**
     * Convert a time string to total minutes for comparison.
     */
    const getTimeInMinutes = useCallback((time: string | null): number | null => {
        if (!time) return null;
        const parsed = DataTypeHelpers.parseTimeSpan(time);
        if (!parsed) return null;
        return (parsed.days * 24 * 60) + (parsed.hours * 60) + parsed.minutes;
    }, []);

    /**
     * Handle individual match time change.
     * If the new time is later than the old time, recalculate all subsequent match times.
     */
    const handleMatchTimeChange = useCallback((matchId: number, time: string | null) => {
        setMatchTimes(prev => {
            const oldTime = prev[matchId];
            const oldMinutes = getTimeInMinutes(oldTime);
            const newMinutes = getTimeInMinutes(time);

            // If new time is later than old time, update subsequent matches
            if (newMinutes !== null && oldMinutes !== null && newMinutes > oldMinutes) {
                const matchIds = Object.keys(prev).map(Number).sort((a, b) => a - b);
                const changedIndex = matchIds.indexOf(matchId);

                if (changedIndex >= 0) {
                    const newMatchTimes = { ...prev };
                    newMatchTimes[matchId] = time;

                    // Recalculate all subsequent match times
                    for (let i = changedIndex + 1; i < matchIds.length; i++) {
                        const subsequentMatchId = matchIds[i];
                        const offsetFromChanged = i - changedIndex;
                        newMatchTimes[subsequentMatchId] = calculateExpectedMatchTime(offsetFromChanged, time, matchLengthInMinutes);
                    }

                    return newMatchTimes;
                }
            }

            // Otherwise just update the single match time
            return {
                ...prev,
                [matchId]: time
            };
        });
    }, [getTimeInMinutes, calculateExpectedMatchTime, matchLengthInMinutes]);

    /**
     * Reset all match times to calculated defaults based on first match time and match length.
     */
    const handleResetMatchTimes = useCallback(() => {
        const matchIds = Object.keys(matchTimes).map(Number).sort((a, b) => a - b);
        if (matchIds.length === 0) return;

        const firstMatchTime = defaultMatchStartTime || matchTimes[matchIds[0]];
        if (!firstMatchTime) return;

        const newMatchTimes: Record<number, string | null> = {};
        for (let i = 0; i < matchIds.length; i++) {
            newMatchTimes[matchIds[i]] = calculateExpectedMatchTime(i, firstMatchTime, matchLengthInMinutes);
        }

        setMatchTimes(newMatchTimes);
    }, [matchTimes, defaultMatchStartTime, calculateExpectedMatchTime, matchLengthInMinutes]);

    // Export schedule stats
    const handleExportStats = async () => {
        const schedulingSettings = getSchedulingSettings();

        try {
            await AstroMeetsService.downloadScheduleStats(
                auth,
                eventId,
                databaseId,
                meetId,
                schedulingSettings,
                useOptimizer
            );
        } catch (err: any) {
            setError(err.message || "Failed to export schedule stats.");
        }
    };

    // Refresh schedule preview
    const handleRefreshPreview = async () => {
        if (selectedTeamIds.length < 2) {
            setError("You must assign at least two teams to generate a schedule.");
            return;
        }

        setIsRefreshingPreview(true);
        setError(null);

        try {
            const schedulingSettings = getSchedulingSettings();

            const preview = await AstroMeetsService.refreshSchedulePreview(
                auth,
                eventId,
                databaseId,
                meetId,
                schedulingSettings,
                useOptimizer
            );

            setSchedulePreview(preview);
            setIsScheduleOutOfDate(false);

            // Update match times for new/changed matches
            const newMatchIds = Object.keys(preview.Matches).map(Number).sort((a, b) => a - b);
            const existingMatchIds = Object.keys(matchTimes).map(Number).sort((a, b) => a - b);

            // If we have new matches that don't exist in current matchTimes, calculate their times
            if (newMatchIds.length > existingMatchIds.length) {
                const newMatchTimes = { ...matchTimes };

                // Find the first match time to use as base
                let firstMatchTime: string | null = null;
                if (existingMatchIds.length > 0 && matchTimes[existingMatchIds[0]]) {
                    firstMatchTime = matchTimes[existingMatchIds[0]];
                } else if (newMatchIds.length > 0 && preview.Matches[newMatchIds[0]]?.MatchTime) {
                    firstMatchTime = preview.Matches[newMatchIds[0]].MatchTime ?? null;
                } else if (defaultMatchStartTime) {
                    // Use database default start time if no other times are available
                    firstMatchTime = defaultMatchStartTime;
                }

                // Calculate times for all matches
                for (let i = 0; i < newMatchIds.length; i++) {
                    const matchId = newMatchIds[i];
                    if (!(matchId in newMatchTimes) || newMatchTimes[matchId] === undefined) {
                        // New match - calculate time
                        if (firstMatchTime) {
                            newMatchTimes[matchId] = calculateExpectedMatchTime(i, firstMatchTime, matchLengthInMinutes);
                        } else {
                            newMatchTimes[matchId] = preview.Matches[matchId]?.MatchTime ?? null;
                        }
                    }
                }

                setMatchTimes(newMatchTimes);
            } else if (newMatchIds.length > 0 && Object.keys(matchTimes).length === 0) {
                // Initialize from preview if we don't have any times yet
                const initialMatchTimes: Record<number, string | null> = {};
                for (const [matchId, match] of Object.entries(preview.Matches)) {
                    initialMatchTimes[Number(matchId)] = match.MatchTime ?? null;
                }
                setMatchTimes(initialMatchTimes);
            }
        } catch (err: any) {
            setError(err.message || "Failed to refresh schedule preview.");
        } finally {
            setIsRefreshingPreview(false);
        }
    };

    // Save handler
    const handleSave = async () => {
        if (!formRef.current?.reportValidity()) {
            return;
        }

        if (!name.trim()) {
            setError("Division name is required.");
            return;
        }

        if (selectedTeamIds.length < 2) {
            setError("You must assign at least two teams.");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            // If schedule is out of date, refresh it first
            let finalPreview = schedulePreview;
            if (isScheduleOutOfDate) {
                const schedulingSettings = getSchedulingSettings();

                finalPreview = await AstroMeetsService.refreshSchedulePreview(
                    auth,
                    eventId,
                    databaseId,
                    meetId,
                    schedulingSettings,
                    useOptimizer
                );
                setSchedulePreview(finalPreview);
            }

            const updatedSchedule = hasOriginalSchedule ? undefined : {
                LinkedMeetIds: linkedMeetIds,
                TeamIds: selectedTeamIds,
                IncludeByesInScores: includeByesInScores,
                HasCustomSchedule: hasCustomSchedule && !isRemovingCustomSchedule,
                IsScheduleChanged: true,
                CustomSchedule: isRemovingCustomSchedule ? null : (finalPreview?.CustomSchedule || customSchedule),
                OptimizedSchedule: isRemovingCustomSchedule ? null : finalPreview?.OptimizedSchedule,
                StartingTemplateRoundOverride: startingRoundOverride,
                TemplateRoundCountOverride: roundCountOverride,
                UseOptimizer: useOptimizer
            };

            // Build the settings to save
            const meetSettings: OnlineMeetSettings = {
                Name: name.trim(),
                RoomNames: roomNames,
                MatchLengthInMinutes: matchLengthInMinutes,
                CustomRules: useCustomRules ? customRules : null,
                MatchTimes: matchTimes,
                VersionId: settings?.VersionId || null,
                Schedule: updatedSchedule
            };

            const result = await AstroMeetsService.createOrUpdateMeet(
                auth,
                eventId,
                databaseId,
                meetId,
                meetSettings,
                useOptimizer
            );

            onSave(result);
            dialogRef.current?.close();
        } catch (err: any) {
            setError(err.message || "Failed to save division settings.");
        } finally {
            setIsSaving(false);
        }
    };

    // Get effective rules for display
    const effectiveRules = useCustomRules && customRules ? customRules : defaultRules;

    return (
        <dialog ref={dialogRef} className="modal" open>
            <div className="modal-box w-full max-w-4xl max-h-[90vh]">
                <h3 className="font-bold text-lg">
                    <FontAwesomeIcon icon="fas faCalendarDays" />
                    <span className="ml-2">
                        {isNew ? "Add Division" : `Edit Division - ${meetName}`}
                    </span>
                </h3>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={onClose}
                    disabled={isSaving}
                >✕</button>

                <div className="mt-4 overflow-y-auto max-h-[65vh]">
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">Loading division settings...</span>
                        </div>
                    )}

                    {error && (
                        <div role="alert" className="alert alert-error">
                            <FontAwesomeIcon icon="fas faCircleExclamation" />
                            <span className="font-bold">Error:</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {!isLoading && (
                        <form ref={formRef} className="space-y-2">
                            {/* Division Name - Always visible at top */}
                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-semibold">Division Name</span>
                                    <span className="label-text-alt text-error">* Required</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={!canEditName}
                                    required
                                    placeholder="Enter division name"
                                />
                            </div>

                            {/* Basic Settings */}
                            <CollapsibleSection
                                pageId="divisionScheduleDialog"
                                elementId="basicSettings"
                                icon="fas faCog"
                                title="Settings"
                                defaultOpen={true}
                                allowMultipleOpen={true}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Match Length (minutes)</span>
                                        </label>
                                        <input
                                            type="number"
                                            className="input input-bordered"
                                            value={matchLengthInMinutes}
                                            onChange={(e) => setMatchLengthInMinutes(Number(e.target.value))}
                                            disabled={!canEditScheduleSettings}
                                            min={1}
                                            max={120}
                                        />
                                    </div>
                                </div>

                                {/* Linked Meets */}
                                <div className="p-2">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline"
                                        onClick={() => setShowLinkedMeetsDialog(true)}
                                        disabled={isSaving}
                                    >
                                        <FontAwesomeIcon icon="fas faLink" />
                                        {linkedMeetIds.length > 1
                                            ? `${linkedMeetIds.length - 1} Linked Division(s)`
                                            : "Link Divisions"}
                                    </button>
                                </div>
                            </CollapsibleSection>

                            {/* Room Names */}
                            <CollapsibleSection
                                pageId="divisionScheduleDialog"
                                elementId="roomNames"
                                icon="fas faDoorOpen"
                                title="Rooms"
                                badges={isScheduleOutOfDate && schedulePreview ? [{
                                    className: "badge-warning",
                                    text: "Out of date"
                                }] : undefined}
                                defaultOpen={true}
                                allowMultipleOpen={true}
                            >
                                <RoomEditor
                                    roomNames={roomNames}
                                    disabled={isSaving}
                                    isReadOnly={!canEditRoomNames}
                                    onRoomNamesChange={setRoomNames}
                                />
                            </CollapsibleSection>

                            {/* Team Selection */}
                            <CollapsibleSection
                                pageId="divisionScheduleDialog"
                                elementId="teams"
                                icon="fas faUsers"
                                title="Teams"
                                badges={[
                                    {
                                        className: "badge-info",
                                        text: `${selectedTeamIds.length} selected`
                                    },
                                    ...(hasCustomSchedule && !isRemovingCustomSchedule ? [{
                                        className: "badge-warning",
                                        text: "Locked (Custom Schedule)"
                                    }] : [])
                                ]}
                                defaultOpen={true}
                                allowMultipleOpen={true}
                            >
                                <TeamSelector
                                    selectedTeamIds={selectedTeamIds}
                                    allTeams={allTeams}
                                    disabled={isSaving}
                                    isReadOnly={!canEditScheduleSettings}
                                    allowAddRemove={!(hasCustomSchedule && !isRemovingCustomSchedule)}
                                    onTeamIdsChange={handleTeamIdsChange}
                                />
                            </CollapsibleSection>

                            {/* Scheduling Options */}
                            <CollapsibleSection
                                pageId="divisionScheduleDialog"
                                elementId="schedulingOptions"
                                icon="fas faSliders"
                                title="Scheduling Options"
                                defaultOpen={false}
                                allowMultipleOpen={true}
                            >
                                <div className="p-2 flex flex-wrap gap-4">
                                    <label className="label cursor-pointer gap-2">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm"
                                            checked={includeByesInScores}
                                            onChange={(e) => handleIncludeByesChange(e.target.checked)}
                                            disabled={!canEditScheduleSettings}
                                        />
                                        <span className="label-text text-sm">Include Byes in Scores</span>
                                    </label>

                                    <div className="form-control">
                                        <label className="label gap-2 p-0">
                                            <span className="label-text text-sm">Starting Round:</span>
                                            <select
                                                className="select select-xs select-bordered w-20"
                                                value={startingRoundOverride ?? ""}
                                                onChange={(e) => handleStartingRoundChange(e.target.value)}
                                                disabled={!canEditScheduleSettings}
                                            >
                                                <option value="">1</option>
                                                {(() => {
                                                    const totalRounds = roundCountOverride ?? (schedulePreview ? Object.keys(schedulePreview.Matches || {}).length : 0);
                                                    return Array.from({ length: totalRounds }, (_, i) => i + 1).map(num => (
                                                        <option key={num} value={num}>{num}</option>
                                                    ));
                                                })()}
                                            </select>
                                        </label>
                                    </div>

                                    <div className="form-control">
                                        <label className="label gap-2 p-0">
                                            <span className="label-text text-sm">Total Rounds:</span>
                                            <input
                                                type="number"
                                                className="input input-xs input-bordered w-16"
                                                value={roundCountOverride ?? ""}
                                                onChange={(e) => handleRoundCountChange(e.target.value)}
                                                disabled={!canEditScheduleSettings}
                                                min={1}
                                                step={1}
                                                placeholder=""
                                            />
                                        </label>
                                    </div>
                                </div>
                            </CollapsibleSection>

                            {/* Custom Schedule */}
                            <CollapsibleSection
                                pageId="divisionScheduleDialog"
                                elementId="customSchedule"
                                icon="fas faFileExcel"
                                title="Custom Schedule"
                                badges={hasCustomSchedule && !isRemovingCustomSchedule ? [{
                                    className: "badge-success",
                                    text: "Active"
                                }] : undefined}
                                defaultOpen={false}
                                allowMultipleOpen={true}
                            >
                                <CustomScheduleUploader
                                    hasCustomSchedule={hasCustomSchedule && !isRemovingCustomSchedule}
                                    isUploading={isUploadingSchedule}
                                    disabled={isSaving}
                                    isReadOnly={!canEditScheduleSettings}
                                    auth={auth}
                                    eventId={eventId}
                                    databaseId={databaseId}
                                    meetId={meetId}
                                    getSchedulingSettings={getSchedulingSettings}
                                    onUpload={handleUploadSchedule}
                                    onRemove={handleRemoveCustomSchedule}
                                />
                            </CollapsibleSection>

                            {/* Custom Rules */}
                            {defaultRules && (
                                <CollapsibleSection
                                    pageId="divisionScheduleDialog"
                                    elementId="customRules"
                                    icon="fas faGavel"
                                    title="Rules"
                                    badges={useCustomRules ? [{
                                        className: "badge-warning",
                                        text: "Custom"
                                    }] : undefined}
                                    defaultOpen={false}
                                    allowMultipleOpen={true}
                                >
                                    <div className="p-2">
                                        <label className="label cursor-pointer gap-2 justify-start mb-3">
                                            <input
                                                type="checkbox"
                                                className="checkbox checkbox-sm"
                                                checked={useCustomRules}
                                                onChange={(e) => handleCustomRulesChange(e.target.checked)}
                                                disabled={!canEditScheduleSettings}
                                            />
                                            <span className="label-text">Use Custom Rules for this Division</span>
                                        </label>

                                        {effectiveRules && (
                                            <div className="border border-base-300 rounded-lg p-3">
                                                <span
                                                    className="text-xs"
                                                    dangerouslySetInnerHTML={{
                                                        __html: MatchRulesClass.toHtmlString(effectiveRules)
                                                    }}
                                                />
                                                {useCustomRules && canEditScheduleSettings && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-secondary mt-3 w-full"
                                                        onClick={() => setIsEditingRules(true)}
                                                        disabled={isSaving}
                                                    >
                                                        <FontAwesomeIcon icon="fas faPencil" />
                                                        Edit Custom Rules
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CollapsibleSection>
                            )}

                            {/* Schedule Preview */}
                            <CollapsibleSection
                                pageId="divisionScheduleDialog"
                                elementId="schedulePreview"
                                icon="fas faTableCells"
                                title="Schedule Preview"
                                badges={isScheduleOutOfDate ? [{
                                    className: "badge-warning",
                                    text: "Out of Date"
                                }] : undefined}
                                defaultOpen={true}
                                allowMultipleOpen={true}
                            >
                                <SchedulePreviewTable
                                    schedulePreview={schedulePreview}
                                    selectedTeamIds={selectedTeamIds}
                                    allTeams={allTeams}
                                    roomNames={roomNames}
                                    includeByesInScores={includeByesInScores}
                                    isOutOfDate={isScheduleOutOfDate}
                                    isRefreshing={isRefreshingPreview}
                                    disabled={isSaving}
                                    isReadOnly={!canEditScheduleSettings}
                                    useOptimizer={useOptimizer}
                                    matchTimes={matchTimes}
                                    onUseOptimizerChange={(value) => {
                                        setUseOptimizer(value);
                                        setIsScheduleOutOfDate(true);
                                        setHasOriginalSchedule(false);
                                    }}
                                    onRefreshPreview={handleRefreshPreview}
                                    onMatchTimeChange={handleMatchTimeChange}
                                    onResetMatchTimes={handleResetMatchTimes}
                                    onExportStats={handleExportStats}
                                />
                            </CollapsibleSection>
                        </form>
                    )}
                </div>

                <div className="mt-4 text-right gap-2 flex justify-end">
                    <button
                        className="btn btn-sm btn-primary"
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                    >
                        {isSaving ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon="fas faSave" />
                                {isNew ? "Create Division" : "Save Division"}
                            </>
                        )}
                    </button>
                    <button
                        className="btn btn-sm btn-secondary"
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                </div>
            </div>

            {/* Linked Meets Dialog */}
            {showLinkedMeetsDialog && (
                <LinkedMeetsDialog
                    currentMeetId={meetId}
                    allMeets={allMeets}
                    linkedMeetIds={linkedMeetIds}
                    meetsWithScores={settings?.AllMeetsWithScores ?? []}
                    isReadOnly={isLinkedMeetsReadOnly}
                    onSave={handleLinkedMeetsSave}
                    onClose={() => setShowLinkedMeetsDialog(false)}
                />
            )}

            {/* Match Rules Dialog */}
            {isEditingRules && defaultRules && (
                <MatchRulesDialog
                    rules={customRules || defaultRules}
                    defaultType={eventType}
                    defaultRules={defaultRules}
                    onSelect={handleRulesDialogClose}
                    isReadOnly={!canEditScheduleSettings}
                />
            )}
        </dialog>
    );
}