import FontAwesomeIcon from "../FontAwesomeIcon";
import { AuthManager, PopupType, UserProfileType } from 'types/AuthManager';
import ConfirmationDialog from "../ConfirmationDialog";
import type { JSX } from "react";

export enum AuthButtonType {
    Desktop,
    Mobile,
    ProtectedRoute
}

interface Props {
    type: AuthButtonType;
}

export default function AuthButton({ type }: Props) {

    const authManager = AuthManager.useNanoStore();

    const isMobile = type !== AuthButtonType.Desktop;

    const userProfile = authManager.userProfile;
    let buttonElement: JSX.Element;
    if (authManager.popupType === PopupType.LoginRequired) {
        return null;
    }
    else if (authManager.popupType != PopupType.None || authManager.isRetrievingProfile) {
        buttonElement = (
            <>
                <div className={`w-${isMobile ? "full" : "24 text-xs"} text-center`}>
                    <div>{authManager.popupType === PopupType.Logout ? "Logging Out" : "Logging In"}</div>
                    <progress className="progress"></progress>
                    {type === AuthButtonType.ProtectedRoute && (
                        <span className="italic">Sometimes this takes 10+ seconds ...</span>
                    )}
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
    else if (userProfile) {

        if (userProfile.type === UserProfileType.NotConfigured) {
            return null;
        }

        const displayName = userProfile.displayName || "Unknown User";

        buttonElement = (
            <div className={`dropdown dropdown-${isMobile ? "start" : "end"}`}>
                <div tabIndex={0} role="button" className="btn btn-primary m-1">
                    <FontAwesomeIcon icon="fas faUser" />&nbsp;{displayName}
                </div>
                <ul
                    tabIndex={0}
                    className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm"
                >
                    <li>
                        <a
                            className="text-base-content"
                            onClick={() => {
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
    else if (type === AuthButtonType.ProtectedRoute) {
        buttonElement = (
            <button
                className="btn btn-primary mt-0 mb-0"
                disabled={authManager.popupType != PopupType.None}
                onClick={() => {
                    authManager.login();
                }}>
                Sign In or Sign-Up
            </button>);
    }
    else {
        return null;
    }

    if (isMobile) {
        return buttonElement;
    }
    else {
        return (
            <div className="sl-flex">
                {buttonElement}
            </div>);
    }
}