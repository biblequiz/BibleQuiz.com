import FontAwesomeIcon from "components/FontAwesomeIcon";
import type React from "react";
import { useNavigate } from "react-router-dom";
import { sharedDirtyWindowState } from "utils/SharedState";

interface Props {
    previousPageLink?: string;
    nextPageLink?: string;
    persistFormToEventInfo(): void;
    saveRegistration: () => Promise<void>;
    children: React.ReactNode;
}

export default function RegistrationPageForm({
    previousPageLink,
    nextPageLink,
    children,
    persistFormToEventInfo,
    saveRegistration }: Props) {

    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Persist the current form.
        persistFormToEventInfo();

        // Navigate to the next page.
        navigate(nextPageLink!);
    };

    const handlePrevious = (e: React.MouseEvent) => {
        e.preventDefault();

        // Persist the current form.
        persistFormToEventInfo();

        // Navigate to the previous page.
        navigate(previousPageLink!);
    };

    const handleSave = async (e: React.MouseEvent) => {
        e.preventDefault();

        // Persist the current form before saving.
        persistFormToEventInfo();

        // Save the registration information.
        await saveRegistration();
    };

    const allowSave = sharedDirtyWindowState.get();

    return (
        <form className="space-y-6 mt-0" onSubmit={handleSubmit}>
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
