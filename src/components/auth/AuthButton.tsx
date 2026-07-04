import FontAwesomeIcon from "../FontAwesomeIcon";
import { AuthManager, PopupType, UserProfileType } from 'types/AuthManager';
import ConfirmationDialog from "../ConfirmationDialog";
import type { JSX } from "react";
import { sharedGlobalStatusToast } from "utils/SharedState";

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
        const busyLabel = authManager.popupType === PopupType.Logout
            ? "Logging Out"
            : authManager.popupType === PopupType.Login
                ? "Logging In"
                : "Refreshing Profile";

        buttonElement = (
            <>
                <div className={`w-${isMobile ? "full" : "24 text-xs"} text-center`}>
                    <div>{busyLabel}</div>
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
        const hasPermissions = !authManager.isImpersonating && (!!userProfile.organizationPermission ||
            (userProfile.regionPermissions && Object.keys(userProfile.regionPermissions).length > 0) ||
            (userProfile.districtPermissions && Object.keys(userProfile.districtPermissions).length > 0) ||
            (userProfile.churchPermissions && userProfile.churchPermissions.size > 0));
        const buttonClassName = authManager.isImpersonating ? "btn btn-error text-white m-1" : "btn btn-primary m-1";
        const buttonLabel = authManager.isImpersonating ? `Impersonating: ${displayName}` : displayName;

        buttonElement = (
            <div className={`dropdown dropdown-${isMobile ? "start" : "end"}`}>
                <div tabIndex={0} role="button" className={buttonClassName}>
                    <FontAwesomeIcon icon={authManager.isImpersonating ? "fas faUserSecret" : "fas faUser"} />&nbsp;{buttonLabel}
                </div>
                <ul
                    tabIndex={0}
                    className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm"
                >
                    {authManager.isImpersonating && (
                        <li>
                            <a
                                className="text-error"
                                onClick={() => {
                                    authManager.stopImpersonating()
                                        .then(() => window.location.assign('/'))
                                        .catch(error => {
                                            sharedGlobalStatusToast.set({
                                                type: "error",
                                                title: "Unable to Stop Impersonating",
                                                message: (error as Error)?.message || "An error occurred while stopping impersonation.",
                                                timeout: 10000,
                                            });
                                        });
                                }}>
                                <FontAwesomeIcon icon="fas faUserSlash" />
                                Stop Impersonating
                            </a>
                        </li>
                    )}
                    {hasPermissions && (
                        <li>
                            <a
                                href="/admin/permissions"
                                className="text-base-content">
                                <FontAwesomeIcon icon="fas faShieldHalved" />
                                Permissions
                            </a>
                        </li>
                    )}
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
    else {
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