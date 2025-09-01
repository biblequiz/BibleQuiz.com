import { useState } from "react";
import { useStore } from "@nanostores/react";
import { Turnstile } from '@marsidev/react-turnstile'
import { sharedDirtyWindowState, sharedGlobalStatusToast } from 'utils/SharedState';
import { AuthService, UserSignUpInfo } from 'types/services/AuthService';
import { CloudflareTurnstile } from 'utils/CloudflareTurnstile';
import { Person } from 'types/services/PeopleService';
import type { RemoteServiceError } from 'types/services/RemoteServiceUtility';
import { AuthManager } from 'types/AuthManager';
import ChurchLookupByState from './ChurchLookupByState';
import ChurchSettingsDialog, { type AddingChurchState } from "../ChurchSettingsDialog";

interface Props {
}

export default function CompleteProfileSection({ }: Props) {

    const authManager = AuthManager.useNanoStore();
    useStore(sharedGlobalStatusToast);

    const existingProfile = authManager.userProfile?.authTokenProfile;

    const [firstName, setFirstName] = useState(existingProfile?.firstName || "");
    const [lastName, setLastName] = useState(existingProfile?.lastName || "");
    const [email, setEmail] = useState(existingProfile?.email || "");
    const [competitionType, setCompetitionType] = useState("");
    const [churchId, setChurchId] = useState("");
    const [addingChurchState, setAddingChurchState] = useState<AddingChurchState | null>(null);
    const [termsAgreed, setTermsAgreed] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        event.stopPropagation();

        sharedGlobalStatusToast.set({
            type: "success",
            title: "Saving",
            message: "We are completing your profile setup now ...",
            showLoading: true,
            keepOpen: true,
        });

        setIsProcessing(true);

        // Create the user information.
        const newPerson = new Person();
        newPerson.FirstName = firstName;
        newPerson.LastName = lastName;
        newPerson.Email = email;
        newPerson.CurrentChurchId = churchId;
        newPerson.DefaultCompetitionTypeId = competitionType;
        newPerson.NotifyOnRegistrationChanges = true;

        if (null == newPerson.PhoneNumber || 0 == newPerson.PhoneNumber.length) {
            newPerson.PhoneNumber = null;
        }

        const newUser = new UserSignUpInfo();
        newUser.Id = newPerson.Email;
        newUser.Person = newPerson;
        newUser.TermsAgree = termsAgreed;
        newUser.CaptchaResponse = CloudflareTurnstile.getCaptchaResponse();

        AuthService.signUp(
            authManager,
            newUser)
            .then(async () => {
                await authManager.refreshRemoteProfile();
                sharedDirtyWindowState.set(false);
                sharedGlobalStatusToast.set(null);
                setIsProcessing(false);
            })
            .catch((error: RemoteServiceError) => {
                CloudflareTurnstile.resetCaptcha();
                sharedGlobalStatusToast.set({
                    type: "error",
                    title: "Error",
                    message: error.message || "An error occurred while saving your profile.",
                    timeout: 10000,
                });

                setIsProcessing(false);
            });
    }

    return (
        <>
            <form id="registrationForm" className="space-y-6" onSubmit={handleSubmit}>
                <div className="w-full mb-0">
                    <h2 className="text-xl font-semibold">Complete Your Profile</h2>
                    <p className="text-base-content/70">
                        You've successfully signed in with a BibleQuiz.com account, but your
                        profile is not yet complete. Please provide the information below.
                        Fields marked with an asterisk (<span className="text-error">*</span>)
                        are required.
                    </p>
                    <p className="text-base-content/70 text-sm italic">
                        If you accidentally signed into the wrong account, you can use the
                        "Sign Out &amp; Change User" button at the bottom of the page.
                    </p>
                </div>
                <div className="divider mb-0" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="w-full mt-4">
                        <label className="label">
                            <span className="label-text font-medium">First Name</span>
                            <span className="label-text-alt text-error">*</span>
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            value={firstName}
                            onChange={e => {
                                setFirstName(e.target.value);
                                sharedDirtyWindowState.set(true);
                            }}
                            placeholder="Enter your first name"
                            className="input input-bordered w-full"
                            disabled={isProcessing}
                            required
                        />
                    </div>
                    <div className="w-full">
                        <label className="label">
                            <span className="label-text font-medium">Last Name</span>
                            <span className="label-text-alt text-error">*</span>
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            value={lastName}
                            onChange={e => {
                                setLastName(e.target.value);
                                sharedDirtyWindowState.set(true);
                            }}
                            placeholder="Enter your last name"
                            className="input input-bordered w-full"
                            disabled={isProcessing}
                            required
                        />
                    </div>
                </div>
                <div className="w-full">
                    <label className="label">
                        <span className="label-text font-medium">Email Address</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={e => {
                            setEmail(e.target.value);
                            sharedDirtyWindowState.set(true);
                        }}
                        placeholder="Enter your email address"
                        className="input input-bordered w-full"
                        disabled={isProcessing}
                        required
                    />
                </div>
                <ChurchLookupByState
                    disabled={isProcessing}
                    allowAdd={{
                        onAdding: setAddingChurchState
                    }}
                    onSelect={church => {
                        setChurchId(church.id);
                        sharedDirtyWindowState.set(true);
                    }}
                />
                <div className="w-full">
                    <label className="label">
                        <span className="label-text font-medium">Default Type of Competition</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                    <div>
                        <select
                            className="select select-bordered w-full"
                            value={competitionType}
                            onChange={e => {
                                setCompetitionType(e.target.value);
                                sharedDirtyWindowState.set(true);
                            }}
                            disabled={isProcessing}
                            required
                        >
                            <option value="agjbq">Junior Bible Quiz (JBQ)</option>
                            <option value="agtbq">Teen Bible Quiz (TBQ)</option>
                        </select>
                    </div>
                </div>
                <div className="w-full">
                    <label className="cursor-pointer flex items-center gap-2">
                        <input
                            type="checkbox"
                            className="checkbox"
                            checked={termsAgreed}
                            onChange={e => {
                                setTermsAgreed(e.target.checked);
                                sharedDirtyWindowState.set(true);
                            }}
                            disabled={isProcessing}
                            required
                        />
                        <span>
                            I agree to the <a href="/terms" target="_blank" className="link">Terms &amp;
                                Conditions</a> and <a href="/privacy" target="_blank" className="link">Privacy Policy</a>
                            <span className="text-danger"> *</span>
                        </span>
                    </label>
                </div>
                <div className="w-full">
                    <Turnstile siteKey={CloudflareTurnstile.siteKey} />
                </div>
                <div className="flex justify-end flex-wrap">
                    <button
                        type="submit"
                        className="btn btn-primary mt-4"
                        disabled={!firstName || !lastName || !email || !churchId || !termsAgreed || isProcessing}
                    >
                        {isProcessing && (<span className="loading loading-spinner loading-md"></span>)}
                        Complete Profile
                    </button>
                    <button
                        type="button"
                        className="btn btn-warning ml-2"
                        onClick={() => {
                            authManager.logout();
                            sharedDirtyWindowState.set(false);
                        }}
                        disabled={isProcessing}
                    >
                        Sign Out & Change User
                    </button>
                </div>
            </form>
            {addingChurchState && (
                <ChurchSettingsDialog
                    title="Add Church"
                    addState={addingChurchState}
                    creatorEmail={email}
                    onSave={() => setAddingChurchState(null)}
                />)}
        </>);
}