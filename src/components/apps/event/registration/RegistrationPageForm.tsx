import FontAwesomeIcon from "components/FontAwesomeIcon";
import type React from "react";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { sharedDirtyWindowState, sharedRequireBlockerCallback as sharedShouldBlockCallback } from "utils/SharedState";

interface Props {
    rootEventUrl: string;
    previousPageLink?: string;
    nextPageLink?: string;
    persistFormToEventInfo?: () => void;
    saveRegistration: () => Promise<void>;
    children: React.ReactNode;
}

export default function RegistrationPageForm({
    rootEventUrl,
    previousPageLink,
    nextPageLink,
    children,
    persistFormToEventInfo,
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

    const allowSave = sharedDirtyWindowState.get();
    sharedShouldBlockCallback.set(nextLocation => {
        if (!checkValidity()) {
            return true;
        }

        // Check if the registration page has changed.
        if (nextLocation === rootEventUrl ||
            nextLocation.startsWith(`${rootEventUrl}/registration/`)) {
            return false;
        }

        return true;
    });

    return (
        <form ref={registrationFormRef} className="space-y-6 mt-0" onSubmit={handleSubmit}>
            <div className="w-full mt-0 flex justify-end gap-2">
                {previousPageLink && (
                    <button
                        type="button"
                        className="btn btn-primary m-0"
                        onClick={handlePrevious}>
                        <FontAwesomeIcon icon="fas faArrowLeft" />
                        Previous
                    </button>)}
                {nextPageLink && (
                    <button
                        type="submit"
                        className="btn btn-success m-0">
                        Next
                        <FontAwesomeIcon icon="fas faArrowRight" />
                    </button>)}
                <button
                    type={nextPageLink ? "button" : "submit"}
                    className={`btn btn-${nextPageLink ? "primary" : "success"} m-0`}
                    onClick={handleSave}
                    disabled={!allowSave}>
                    <FontAwesomeIcon icon="fas faFloppyDisk" />
                    Save Changes
                </button>
            </div>

            {children}

            <div className="w-full mt-0 flex justify-end gap-2">
                {previousPageLink && (
                    <button
                        type="button"
                        className="btn btn-primary m-0"
                        onClick={handlePrevious}>
                        <FontAwesomeIcon icon="fas faArrowLeft" />
                        Previous
                    </button>)}
                {nextPageLink && (
                    <button
                        type="submit"
                        className="btn btn-success m-0">
                        Next
                        <FontAwesomeIcon icon="fas faArrowRight" />
                    </button>)}
                <button
                    type={nextPageLink ? "button" : "submit"}
                    className={`btn btn-${nextPageLink ? "primary" : "success"} m-0`}
                    onClick={handleSave}
                    disabled={!allowSave}>
                    <FontAwesomeIcon icon="fas faFloppyDisk" />
                    Save Changes
                </button>
            </div>
        </form>);
}
