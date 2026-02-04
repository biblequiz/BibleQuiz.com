import { useStore } from "@nanostores/react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useState, useRef, useEffect } from "react";
import { sharedDirtyWindowState } from "utils/SharedState";
import { useOutletContext } from "react-router-dom";
import type { EventProviderContext } from "../EventProvider";
import { EventsService } from "types/services/EventsService";

interface Props {
}

export default function ScoringSettingsPage({ }: Props) {

    const {
        auth,
        info,
        setLatestEvent } = useOutletContext<EventProviderContext>();

    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [savingError, setSavingError] = useState<string | null>(null);
    const [allowScoring, setAllowScoring] = useState<boolean>(false);
    const [scoringCode, setScoringCode] = useState<string | undefined>();
    const [isHiddenFromLive, setIsHiddenFromLive] = useState<boolean>(false);
    const [isPublishedToArchive, setIsPublishedToArchive] = useState<boolean>(true);

    const formRef = useRef<HTMLFormElement>(null);
    const hasChanges = useStore(sharedDirtyWindowState);

    const handleSave = (e: React.MouseEvent | React.FormEvent) => {
        e.preventDefault();

        if (!formRef.current!.reportValidity()) {
            return;
        }

        setIsSaving(true);
        setSavingError(null);
        setSuccessMessage(null);

        info!.ScoringCode = allowScoring ? (scoringCode ?? null) : null;
        info!.IsHiddenFromLiveEvents = isHiddenFromLive;
        info!.PublishToArchives = isPublishedToArchive;

        EventsService.update(
            auth,
            info!)
            .then(updated => {
                setIsSaving(false);
                setSuccessMessage("Scoring settings saved successfully.");
                setSavingError(null);
                setLatestEvent(updated);

                sharedDirtyWindowState.set(false);
            })
            .catch(err => {
                setIsSaving(false);
                setSavingError(err.message || "An error occurred while saving the settings.");
            });
    };

    useEffect(() => {
        setAllowScoring(!!info!.ScoringCode);
        setScoringCode(info!.ScoringCode ?? undefined);
        setIsHiddenFromLive(!!info!.IsHiddenFromLiveEvents);
        setIsPublishedToArchive(info!.PublishToArchives);
    }, [info]);

    return (
        <form ref={formRef} className="space-y-6 mt-0" onSubmit={handleSave}>
            {successMessage && (
                <div role="alert" className="alert alert-success mt-4 w-full">
                    <FontAwesomeIcon icon="fas faCircleCheck" />
                    <div>
                        <b>Success: </b>
                        {successMessage}
                    </div>
                </div>)}

            {savingError && (
                <div role="alert" className="alert alert-error mt-4 w-full">
                    <FontAwesomeIcon icon="fas faCircleExclamation" />
                    <div>
                        <b>Error: </b>
                        {savingError.indexOf("<br />") >= 0
                            ? (<span dangerouslySetInnerHTML={{ __html: savingError }} />)
                            : (<span>{savingError}</span>)}
                    </div>
                </div>)}

            <div className="w-full ml-2 mt-4 mb-0">
                <label className="label text-wrap">
                    <input
                        type="checkbox"
                        name="isHiddenFromLiveEvents"
                        className="checkbox checkbox-sm checkbox-info"
                        checked={allowScoring}
                        disabled={isSaving}
                        onChange={e => {
                            setAllowScoring(e.target.checked);
                            sharedDirtyWindowState.set(true);
                        }}
                    />
                    <span>
                        Enable Electronic Scoring via EZScore?
                    </span>
                </label>
            </div>

            <div className="form-control w-full mt-2 mb-0">
                <label className="label">
                    <span className="label-text font-medium text-sm">Scoring Code</span>
                    <span className="label-text-alt text-error">*</span>
                </label>
                <input
                    type="text"
                    className="input w-full"
                    placeholder="Scoring Code"
                    value={scoringCode ?? ""}
                    onChange={e => {
                        setScoringCode(e.target.value);
                        sharedDirtyWindowState.set(true);
                    }}
                    disabled={isSaving || !allowScoring}
                    maxLength={50}
                    required={allowScoring}
                />
            </div>

            <div className="w-full ml-2 mt-2 mb-0">
                <label className="label text-wrap">
                    <input
                        type="checkbox"
                        name="isHiddenFromLiveEvents"
                        className="checkbox checkbox-sm checkbox-info"
                        checked={isHiddenFromLive}
                        disabled={isSaving}
                        onChange={e => {
                            setIsHiddenFromLive(e.target.checked);
                            sharedDirtyWindowState.set(true);
                        }}
                    />
                    <span>
                        Hide from the Upcoming & Live section of BibleQuiz.com?
                    </span>
                </label>
            </div>

            <div className="w-full ml-2 mt-2 mb-0">
                <label className="label text-wrap">
                    <input
                        type="checkbox"
                        name="isPublishedToArchive"
                        className="checkbox checkbox-sm checkbox-info"
                        checked={isPublishedToArchive}
                        disabled={isSaving}
                        onChange={e => {
                            setIsPublishedToArchive(e.target.checked);
                            sharedDirtyWindowState.set(true);
                        }}
                    />
                    <span>
                        Show in BibleQuiz.com's history after the event ends?
                    </span>
                </label>
            </div>

            <button
                type="submit"
                className="btn btn-sm btn-success"
                onClick={handleSave}
                disabled={!hasChanges || isSaving}>
                <FontAwesomeIcon icon="fas faFloppyDisk" />
                Save Changes
            </button>
        </form>);
}