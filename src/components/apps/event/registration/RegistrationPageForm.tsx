import { useStore } from "@nanostores/react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import type React from "react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BlockerCallbackResult, sharedDirtyWindowState, sharedRequireBlockerCallback as sharedShouldBlockCallback } from "utils/SharedState";

export interface RegistrationFormContext {
    rootEventUrl: string;
    isNewEvent: boolean;
    hasRegistrations: boolean;
    saveRegistration: () => Promise<void>;
    cloneEvent: () => Promise<void>;
    copyRegistrations: () => Promise<void>;
    sendEmail: () => Promise<void>;
    copyLink: () => Promise<void>;
    deleteEvent: () => Promise<void>;
}

interface Props {
    context: RegistrationFormContext;
    isSaving: boolean;
    previousPageLink?: string;
    nextPageLink?: string;
    setCustomValidation?: () => boolean;
    persistFormToEventInfo?: () => void;
    children: React.ReactNode;
}

export default function RegistrationPageForm({
    context,
    isSaving,
    previousPageLink,
    nextPageLink,
    children,
    persistFormToEventInfo,
    setCustomValidation }: Props) {

    const navigate = useNavigate();
    const registrationFormRef = useRef<HTMLFormElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Persist the current form.
        if (persistFormToEventInfo) {
            persistFormToEventInfo();
        }

        // Navigate to the next page.
        navigate(nextPageLink!);
    };

    const checkValidity = (): boolean => {

        let isValid: boolean = true;
        if (registrationFormRef.current) {
            isValid = registrationFormRef.current.reportValidity();

            if (isValid && setCustomValidation) {
                if (!setCustomValidation()) {
                    return false;
                }

                isValid = registrationFormRef.current.reportValidity();
            }
        }

        if (isValid && persistFormToEventInfo) {
            persistFormToEventInfo();
        }

        return isValid;
    }

    const handlePrevious = (e: React.MouseEvent) => {
        e.preventDefault();

        if (!checkValidity()) {
            return;
        }

        // Navigate to the previous page.
        navigate(previousPageLink!);
    };

    const handleSave = async (e: React.MouseEvent) => {
        e.preventDefault();

        if (!checkValidity()) {
            return;
        }

        // Save the registration information.
        
        await context.saveRegistration();
    };

    const allowSave = useStore(sharedDirtyWindowState);
    sharedShouldBlockCallback.set(nextLocation => {
        if (!checkValidity()) {
            return BlockerCallbackResult.Block;
        }

        // Check if the registration page has changed.
        if (nextLocation === context.rootEventUrl ||
            nextLocation.startsWith(`${context.rootEventUrl}/registration/`)) {
            return BlockerCallbackResult.Allow;
        }

        return BlockerCallbackResult.ShowPrompt;
    });

    return (
        <form ref={registrationFormRef} className="space-y-6 mt-0" onSubmit={handleSubmit}>
            <div className="w-full mt-0 mb-0 flex flex-wrap justify-end gap-2">
                {previousPageLink && (
                    <button
                        type="button"
                        className="btn btn-primary m-0"
                        onClick={handlePrevious}
                        disabled={isSaving}>
                        <FontAwesomeIcon icon="fas faArrowLeft" />
                        Previous
                    </button>)}
                {nextPageLink && (
                    <button
                        type="submit"
                        className="btn btn-success m-0"
                        disabled={isSaving}>
                        Next
                        <FontAwesomeIcon icon="fas faArrowRight" />
                    </button>)}
                <button
                    type={nextPageLink ? "button" : "submit"}
                    className={`btn btn-${nextPageLink ? "primary" : "success"} m-0`}
                    onClick={handleSave}
                    disabled={!allowSave || isSaving}>
                    <FontAwesomeIcon icon="fas faFloppyDisk" />
                    Save Changes
                </button>

                <button
                    type="button"
                    className={`btn btn-accent m-0`}
                    onClick={context.cloneEvent}
                    disabled={isSaving || context.isNewEvent}>
                    <FontAwesomeIcon icon="fas faClone" />
                    <span className="hidden md:inline">Clone Event</span>
                </button>
                <button
                    type="button"
                    className={`btn btn-accent m-0`}
                    onClick={context.copyRegistrations}
                    disabled={isSaving || context.isNewEvent}>
                    <FontAwesomeIcon icon="fas faUserPen" />
                    <span className="hidden md:inline">Copy Registrations</span>
                </button>
                <button
                    type="button"
                    className={`btn btn-accent m-0`}
                    onClick={context.sendEmail}
                    disabled={isSaving || context.isNewEvent}>
                    <FontAwesomeIcon icon="fas faEnvelope" />
                </button>
                <button
                    type="button"
                    className={`btn btn-accent m-0`}
                    onClick={context.copyLink}
                    disabled={isSaving || context.isNewEvent}>
                    <FontAwesomeIcon icon="fas faLink" />
                </button>
                <button
                    type="button"
                    className={`btn btn-error m-0`}
                    onClick={context.deleteEvent}
                    disabled={isSaving || context.hasRegistrations || context.isNewEvent}>
                    <FontAwesomeIcon icon="fas faTrash" />
                </button>
            </div>

            <div className="divider mt-0" />

            {isSaving && (
                <div className="hero bg-base-300 rounded-2xl shadow-lg">
                    <div className="hero-content text-center py-16 px-8">
                        <div className="max-w-4xl">
                            <h1 className="text-3xl font-bold text-base-content mb-4">
                                <span className="loading loading-spinner loading-lg"></span>
                                <span className="ml-4">Saving Changes ...</span>
                            </h1>
                            <p className="text-lg text-base-content/70 mb-8">
                                Your changes are being saved. It may take a few hours for the changes to be live
                                on BibleQuiz.com.
                            </p>
                        </div>
                    </div>
                </div>)}
            {!isSaving && children}

            <div className="divider mb-0" />

            <div className="w-full mt-0 flex flex-wrap justify-end gap-2">
                {previousPageLink && (
                    <button
                        type="button"
                        className="btn btn-primary m-0"
                        onClick={handlePrevious}
                        disabled={isSaving}>
                        <FontAwesomeIcon icon="fas faArrowLeft" />
                        Previous
                    </button>)}
                {nextPageLink && (
                    <button
                        type="submit"
                        className="btn btn-success m-0"
                        disabled={isSaving}>
                        Next
                        <FontAwesomeIcon icon="fas faArrowRight" />
                    </button>)}
                <button
                    type={nextPageLink ? "button" : "submit"}
                    className={`btn btn-${nextPageLink ? "primary" : "success"} m-0`}
                    onClick={handleSave}
                    disabled={!allowSave || isSaving}>
                    <FontAwesomeIcon icon="fas faFloppyDisk" />
                    Save Changes
                </button>
                <button
                    type="button"
                    className={`btn btn-accent m-0`}
                    onClick={context.cloneEvent}
                    disabled={isSaving || context.isNewEvent}>
                    <FontAwesomeIcon icon="fas faClone" />
                    <span className="hidden md:inline">Clone Event</span>
                </button>
                <button
                    type="button"
                    className={`btn btn-accent m-0`}
                    onClick={context.copyRegistrations}
                    disabled={isSaving || context.isNewEvent}>
                    <FontAwesomeIcon icon="fas faUserPen" />
                    <span className="hidden md:inline">Copy Registrations</span>
                </button>
                <button
                    type="button"
                    className={`btn btn-accent m-0`}
                    onClick={context.sendEmail}
                    disabled={isSaving || context.isNewEvent}>
                    <FontAwesomeIcon icon="fas faEnvelope" />
                </button>
                <button
                    type="button"
                    className={`btn btn-accent m-0`}
                    onClick={context.copyLink}
                    disabled={isSaving || context.isNewEvent}>
                    <FontAwesomeIcon icon="fas faLink" />
                </button>
                <button
                    type="button"
                    className={`btn btn-error m-0`}
                    onClick={context.deleteEvent}
                    disabled={isSaving || context.hasRegistrations || context.isNewEvent}>
                    <FontAwesomeIcon icon="fas faTrash" />
                </button>
            </div>
        </form>);
}
