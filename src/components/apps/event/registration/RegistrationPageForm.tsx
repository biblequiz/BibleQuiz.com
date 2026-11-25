import { useStore } from "@nanostores/react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BlockerCallbackResult, sharedDirtyWindowState, sharedRequireBlockerCallback as sharedShouldBlockCallback } from "utils/SharedState";
import { copyToClipboard } from "utils/Clipboard";

type InvalidControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

interface ValidationProblem {
    control: InvalidControl;
    label: string;
    message: string;
}

/** Finds the name a person would recognize for a control: its label, else its placeholder. */
const describeControl = (control: InvalidControl): string => {
    const labelled = control.getAttribute("aria-label");
    if (labelled) {
        return labelled;
    }

    // Only the label directly above the control counts. Looking further up finds the first label
    // of some other field in a shared container (e.g. the address inputs share a grid with a name
    // field), which would name the wrong field. Controls without their own label need an aria-label.
    const text = control.parentElement
        ?.querySelector(":scope > label .label-text")
        ?.textContent
        ?.trim();
    if (text) {
        return text;
    }

    return (control as HTMLInputElement).placeholder || control.name || "This field";
};

const collectProblems = (form: HTMLFormElement): ValidationProblem[] =>
    Array.from(form.querySelectorAll<InvalidControl>("input:invalid, select:invalid, textarea:invalid"))
        .filter(c => !c.disabled)
        .map(control => ({
            control,
            label: describeControl(control),
            message: control.validationMessage
        }));

export interface RegistrationFormContext {
    rootEventUrl: string;
    /** Full address of the event's public registration page, for sharing outside the site. */
    registrationLink: string | null;
    isNewEvent: boolean;
    hasRegistrations: boolean;
    saveRegistration: () => Promise<void>;
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

    const [hasCopiedLink, setHasCopiedLink] = useState(false);

    // Set after a failed attempt to move on or save. Until then, untouched fields aren't flagged.
    const [problems, setProblems] = useState<ValidationProblem[] | null>(null);

    const goToProblem = (problem: ValidationProblem) => {
        problem.control.scrollIntoView({ block: "center", behavior: "smooth" });
        problem.control.focus({ preventScroll: true });
        problem.control.reportValidity();
    };

    // Keep the list current after every render, so a field drops off it when it is fixed, and a
    // card that is deleted (which fires no change event) doesn't leave a dead entry behind.
    // Child effects have already applied their validity messages by the time this runs.
    useEffect(() => {
        if (problems === null || !registrationFormRef.current) {
            return;
        }

        const current = collectProblems(registrationFormRef.current);
        const isSame = current.length === problems.length &&
            current.every((p, i) => p.control === problems[i].control && p.message === problems[i].message);
        if (!isSame) {
            setProblems(current.length > 0 ? current : null);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // The form is noValidate, so Next (and Enter) get the same check as Save and Previous.
        // Relying on the browser's own check at submit time skipped the custom checks and used
        // whatever messages were left over from earlier edits.
        if (!checkValidity()) {
            return;
        }

        // Navigate to the next page.
        navigate(nextPageLink!);
    };

    const checkValidity = (): boolean => {

        let isValid: boolean = true;
        if (registrationFormRef.current) {

            // Apply the page's own checks first so they are reported together with the built-in
            // ones, and so a message that no longer applies has been cleared by the time the
            // browser looks at it.
            if (setCustomValidation && !setCustomValidation()) {
                return false;
            }

            isValid = registrationFormRef.current.reportValidity();
            setProblems(isValid ? null : collectProblems(registrationFormRef.current));
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

    const buttons = (
        <>
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
                onClick={async () => {
                    if (!context.registrationLink) {
                        return;
                    }

                    if (!await copyToClipboard(context.registrationLink, "Copy this registration link:")) {
                        return;
                    }

                    if (!hasCopiedLink) {
                        setHasCopiedLink(true);
                        setTimeout(() => setHasCopiedLink(false), 5000);
                    }
                }}
                disabled={isSaving || context.isNewEvent}>
                <FontAwesomeIcon icon={`fas ${hasCopiedLink ? "faCheck" : "faLink"}`} />
            </button>
        </>);

    return (
        <form
            ref={registrationFormRef}
            className={`space-y-6 mt-0${problems ? " show-validation-errors" : ""}`}
            onSubmit={handleSubmit}
            noValidate>
            <div className="w-full mt-0 mb-0 flex flex-wrap justify-end gap-2">
                {buttons}
            </div>

            <div className="divider mt-0" />

            {problems && problems.length > 0 && !isSaving && (
                <div role="alert" className="alert alert-error alert-soft block mt-0">
                    <div className="font-bold mb-1">
                        <FontAwesomeIcon icon="fas faTriangleExclamation" />&nbsp;
                        {problems.length === 1
                            ? "1 field needs your attention"
                            : `${problems.length} fields need your attention`}
                    </div>
                    <ul className="list-none p-0 m-0">
                        {problems.map((problem, index) => (
                            <li key={`problem-${index}`} className="mt-0">
                                <button
                                    type="button"
                                    className="link link-hover text-left text-error"
                                    onClick={() => goToProblem(problem)}>
                                    <b>{problem.label}:</b> {problem.message}
                                </button>
                            </li>))}
                    </ul>
                </div>)}

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
                {buttons}
            </div>
        </form>);
}
