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
import RoomEditor from "./RoomEditor";
import SchedulePreviewTable from "./SchedulePreviewTable";
import CustomScheduleUploader from "./CustomScheduleUploader";

interface Props {
    auth: AuthManager;
    eventId: string;
    eventType?: string;
    databaseId: string;
    meetId: number;
    meetName: string;
    allMeets: OnlineDatabaseMeetSummary[];
    defaultRules?: MatchRules | null;
    isReadOnly: boolean;
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
    isReadOnly,
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
    const [saveError, setSaveError] = useState<string | null>(null);

    // Meet settings
    const [settings, setSettings] = useState<OnlineMeetSettings | null>(null);
    const [schedulePreview, setSchedulePreview] = useState<OnlineMeetSchedulePreview | null>(null);
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

    // Dialog state
    const [showLinkedMeetsDialog, setShowLinkedMeetsDialog] = useState(false);

    // All available teams from the database
    const [allTeams, setAllTeams] = useState<Record<number, TeamOrQuizzerReference>>({});

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
                    setHasCustomSchedule(data.Schedule.HasCustomSchedule || false);
                }

                if (data.Preview && !isNew) {
                    setSchedulePreview(data.Preview);
                    setIsScheduleOutOfDate(false);
                }

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
                const newRooms = [...roomNames];
                if (requiredRooms > roomNames.length) {
                    for (let i = roomNames.length; i < requiredRooms; i++) {
                        newRooms.push(`Room ${i + 1}`);
                    }
                } else {
                    newRooms.length = requiredRooms;
                }
                setRoomNames(newRooms);
            }
        }
    }, [schedulePreview?.RoomCount]);

    // Mark schedule as out of date when settings change
    const markScheduleOutOfDate = useCallback(() => {
        setIsScheduleOutOfDate(true);
    }, []);

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
        const parsed = parseInt(value, 10);
        setRoundCountOverride(isNaN(parsed) || parsed < 1 ? null : parsed);
        markScheduleOutOfDate();
    };

    // Custom schedule handlers
    const handleUploadSchedule = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingSchedule(true);
        setSaveError(null);

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
            setSaveError(err.message || "Failed to parse schedule file.");
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

    // Refresh schedule preview
    const handleRefreshPreview = async () => {
        if (selectedTeamIds.length < 2) {
            setSaveError("You must assign at least two teams to generate a schedule.");
            return;
        }

        setIsRefreshingPreview(true);
        setSaveError(null);

        try {
            const schedulingSettings: OnlineMeetSchedulingSettings = {
                LinkedMeetIds: linkedMeetIds,
                TeamIds: selectedTeamIds,
                IncludeByesInScores: includeByesInScores,
                HasCustomSchedule: hasCustomSchedule && !isRemovingCustomSchedule,
                IsScheduleChanged: true,
                CustomSchedule: customSchedule,
                OptimizedSchedule: null,
                StartingTemplateRoundOverride: startingRoundOverride,
                TemplateRoundCountOverride: roundCountOverride
            };

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
        } catch (err: any) {
            setSaveError(err.message || "Failed to refresh schedule preview.");
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
            setSaveError("Division name is required.");
            return;
        }

        if (selectedTeamIds.length < 2) {
            setSaveError("You must assign at least two teams.");
            return;
        }

        setIsSaving(true);
        setSaveError(null);

        try {
            // If schedule is out of date, refresh it first
            let finalPreview = schedulePreview;
            if (isScheduleOutOfDate) {
                const schedulingSettings: OnlineMeetSchedulingSettings = {
                    LinkedMeetIds: linkedMeetIds,
                    TeamIds: selectedTeamIds,
                    IncludeByesInScores: includeByesInScores,
                    HasCustomSchedule: hasCustomSchedule && !isRemovingCustomSchedule,
                    IsScheduleChanged: true,
                    CustomSchedule: isRemovingCustomSchedule ? null : customSchedule,
                    OptimizedSchedule: isRemovingCustomSchedule ? null : null,
                    StartingTemplateRoundOverride: startingRoundOverride,
                    TemplateRoundCountOverride: roundCountOverride
                };

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

            // Build the settings to save
            const meetSettings: OnlineMeetSettings = {
                Name: name.trim(),
                RoomNames: roomNames,
                MatchLengthInMinutes: matchLengthInMinutes,
                CustomRules: useCustomRules ? customRules : null,
                VersionId: settings?.VersionId || null,
                Schedule: {
                    LinkedMeetIds: linkedMeetIds,
                    TeamIds: selectedTeamIds,
                    IncludeByesInScores: includeByesInScores,
                    HasCustomSchedule: hasCustomSchedule && !isRemovingCustomSchedule,
                    IsScheduleChanged: true,
                    CustomSchedule: isRemovingCustomSchedule ? null : (finalPreview?.CustomSchedule || customSchedule),
                    OptimizedSchedule: isRemovingCustomSchedule ? null : finalPreview?.OptimizedSchedule,
                    StartingTemplateRoundOverride: startingRoundOverride,
                    TemplateRoundCountOverride: roundCountOverride
                }
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
            setSaveError(err.message || "Failed to save division settings.");
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
                            <div>
                                <b>Error: </b>{error}
                            </div>
                        </div>
                    )}

                    {saveError && (
                        <div role="alert" className="alert alert-error mb-4">
                            <FontAwesomeIcon icon="fas faTriangleExclamation" />
                            <div>
                                <b>Error: </b>{saveError}
                            </div>
                        </div>
                    )}

                    {!isLoading && !error && (
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
                                    disabled={isSaving || isReadOnly}
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
                                            disabled={isSaving || isReadOnly}
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
                                        disabled={isSaving || isReadOnly}
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
                                    isReadOnly={isReadOnly}
                                    onRoomNamesChange={setRoomNames}
                                />
                            </CollapsibleSection>

                            {/* Team Selection */}
                            <CollapsibleSection
                                pageId="divisionScheduleDialog"
                                elementId="teams"
                                icon="fas faUsers"
                                title="Teams"
                                badges={[{
                                    className: "badge-info",
                                    text: `${selectedTeamIds.length} selected`
                                }]}
                                defaultOpen={true}
                                allowMultipleOpen={true}
                            >
                                <TeamSelector
                                    selectedTeamIds={selectedTeamIds}
                                    allTeams={allTeams}
                                    disabled={isSaving}
                                    isReadOnly={isReadOnly}
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
                                            disabled={isSaving || isReadOnly}
                                        />
                                        <span className="label-text text-sm">Include Byes in Scores</span>
                                    </label>

                                    <div className="form-control">
                                        <label className="label gap-2 p-0">
                                            <span className="label-text text-sm">Starting Round:</span>
                                            <input
                                                type="number"
                                                className="input input-xs input-bordered w-16"
                                                value={startingRoundOverride || ""}
                                                onChange={(e) => handleStartingRoundChange(e.target.value)}
                                                disabled={isSaving || isReadOnly}
                                                min={1}
                                                placeholder="1"
                                            />
                                        </label>
                                    </div>

                                    <div className="form-control">
                                        <label className="label gap-2 p-0">
                                            <span className="label-text text-sm">Round Count:</span>
                                            <input
                                                type="number"
                                                className="input input-xs input-bordered w-16"
                                                value={roundCountOverride || ""}
                                                onChange={(e) => handleRoundCountChange(e.target.value)}
                                                disabled={isSaving || isReadOnly}
                                                min={1}
                                                placeholder="Auto"
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
                                    isReadOnly={isReadOnly}
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
                                                disabled={isSaving || isReadOnly}
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
                                                {useCustomRules && !isReadOnly && (
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
                                    isReadOnly={isReadOnly}
                                    useOptimizer={useOptimizer}
                                    onUseOptimizerChange={setUseOptimizer}
                                    onRefreshPreview={handleRefreshPreview}
                                />
                            </CollapsibleSection>
                        </form>
                    )}
                </div>

                <div className="mt-4 text-right gap-2 flex justify-end">
                    {!isReadOnly && (
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
                    )}
                    <button
                        className="btn btn-sm btn-secondary"
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        {isReadOnly ? "Close" : "Cancel"}
                    </button>
                </div>
            </div>

            {/* Linked Meets Dialog */}
            {showLinkedMeetsDialog && (
                <LinkedMeetsDialog
                    currentMeetId={meetId}
                    currentMeetName={name}
                    allMeets={allMeets}
                    linkedMeetIds={linkedMeetIds}
                    isReadOnly={isReadOnly}
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
                    isReadOnly={isReadOnly}
                />
            )}
        </dialog>
    );
}