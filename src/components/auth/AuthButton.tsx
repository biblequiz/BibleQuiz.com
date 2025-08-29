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

        if (userProfile.type === UserProfileType.NotConfigured) {
            return null;
        }

        const displayName = userProfile.displayName || "Unknown User";

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
        return null;
    }
}