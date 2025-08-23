import { useStore } from "@nanostores/react";
import FontAwesomeIcon from "../FontAwesomeIcon";
import { AuthManager, PopupType, UserProfileType } from "../../types/AuthManager";
import ConfirmationDialog from "../ConfirmationDialog";

interface Props {
    isMobile: boolean;
}

export default function AuthButton({ isMobile }: Props) {

    const authManager = AuthManager.useNanoStore();

    const userProfile = authManager.userProfile;
    if (authManager.popupType != PopupType.None || authManager.isRetrievingProfile) {
        return (
            <>
                <div className={`w-${isMobile ? "full" : "24 text-xs"} text-center`}>
                    <div>{authManager.popupType === PopupType.Logout ? "Logging Out" : "Logging In"}</div>
                    <progress className="progress"></progress>
                </div>
                {authManager.popupType === PopupType.LoginConfirmationDialog && (
                    <div className="text-base-content">
                        <ConfirmationDialog
                            id="confirmation-dialog-complete-profile"
                            title="Sign-In Required"
                            yesLabel="Sign In"
                            onYes={() => authManager.login()}
                            noLabel="Cancel"
                            onNo={() => authManager.logout()}>
                            <p>
                                Your session has expired or you have signed out. You need to sign in again
                                to avoid losing any unsaved changes.
                            </p>
                        </ConfirmationDialog>
                    </div>)}
            </>);
    }

    if (userProfile) {

        let displayName: string = "";

        if (userProfile.type === UserProfileType.NotConfigured) {
            if (window.location.pathname === "/profile" || window.location.pathname === "/profile/") {
                const profile = userProfile.authTokenProfile;
                if (profile) {
                    displayName = `${profile.firstName} ${profile.lastName}`;
                }
                else {
                    displayName = "Unknown";
                }
            }
            else if (userProfile.hasSignUpDialogDisplayed) {
                return (
                    <a
                        className="btn btn-primary"
                        href="/profile">
                        Complete Sign-Up
                    </a>);
            }
            else {
                return (
                    <>
                        <div className={`w-${isMobile ? "full" : "24 text-xs"} text-center`}>
                            <div>Logging In</div>
                            <progress className="progress"></progress>
                        </div>
                        <div className="text-base-content">
                            <ConfirmationDialog
                                id="confirmation-dialog-complete-profile"
                                title="Complete Account Setup"
                                yesLabel="Enter Remaining Information"
                                onYes={() => {
                                    authManager.markDisplaySignUpDialogAsDisplayed();
                                    window.location.href = "/profile";
                                }}
                                noLabel="Sign Out & Change Account"
                                onNo={async () => {
                                    await authManager.logout();
                                }}>
                                <p>
                                    You're almost done setting up your BibleQuiz.com account. You just need to finish
                                    setting up your profile.
                                </p>
                                <p className="mt-2 mb-4">
                                    Click the "Enter Remaining Information" button below to complete the information.
                                    Some of it was collected when you created your user account.
                                </p>
                            </ConfirmationDialog>
                        </div>
                    </>);
            }
        }
        else {
            displayName = userProfile.displayName || "Unknown User";
        }

        return (
            <div className={`dropdown dropdown-${isMobile ? "start" : "end"}`}>
                <div tabIndex={0} role="button" className="btn btn-primary m-1">
                    <FontAwesomeIcon icon="fas faUser" />&nbsp;{displayName}
                </div>
                <ul
                    tabIndex={0}
                    className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm"
                >
                    <li className="text-base-content">
                        <a href="/profile">
                            <FontAwesomeIcon icon="fas faAddressCard" />
                            My Profile
                        </a>
                    </li>
                    <li className="text-base-content">
                        <a onClick={() => {
                            if (authManager.popupType == PopupType.None) {
                                authManager.logout();
                            }
                        }}>
                            <FontAwesomeIcon icon="fas faArrowRightFromBracket" />
                            Sign Out
                        </a>
                    </li>
                </ul>
            </div>);
    }
    else {
        return (
            <button className="btn btn-primary" disabled={authManager.popupType != PopupType.None} onClick={() => {
                authManager.login();
            }}>
                Sign In / Sign-Up
            </button>);
    }
}