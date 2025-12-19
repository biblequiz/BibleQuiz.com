import { useStore } from "@nanostores/react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import type React from "react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BlockerCallbackResult, sharedDirtyWindowState, sharedRequireBlockerCallback as sharedShouldBlockCallback } from "utils/SharedState";

interface Props {
    rootEventUrl: string;
    isSaving: boolean;
    previousPageLink?: string;
    nextPageLink?: string;
    setCustomValidation?: () => boolean;
    persistFormToEventInfo?: () => void;
    saveRegistration: () => Promise<void>;
    children: React.ReactNode;
}

export default function RegistrationPageForm({
    rootEventUrl,
    isSaving,
    previousPageLink,
    nextPageLink,
    children,
    persistFormToEventInfo,
    setCustomValidation,
    saveRegistration }: Props) {

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
        await saveRegistration();
    };

    const allowSave = useStore(sharedDirtyWindowState);
    sharedShouldBlockCallback.set(nextLocation => {
        if (!checkValidity()) {
            return BlockerCallbackResult.Block;
        }

        // Check if the registration page has changed.
        if (nextLocation === rootEventUrl ||
            nextLocation.startsWith(`${rootEventUrl}/registration/`)) {
            return BlockerCallbackResult.Allow;
        }

        return BlockerCallbackResult.ShowPrompt;
    });

    return (
        <form ref={registrationFormRef} className="space-y-6 mt-0" onSubmit={handleSubmit}>
            <div className="w-full mt-0 flex justify-end gap-2">
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
            </div>

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

            <div className="w-full mt-0 flex justify-end gap-2">
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
            </div>
        </form>);
}
