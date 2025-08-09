import { useStore } from "@nanostores/react";
import { sharedAuthManager } from "../../utils/SharedState";
import FontAwesomeIcon from "../FontAwesomeIcon";
import Dialog from "../Dialog";
import { PopupType, UserProfileType } from "../../types/AuthManager";

interface Props {
    isMobile: boolean;
}

export default function AuthButton({ isMobile }: Props) {

    const authManager = useStore(sharedAuthManager);

    const userProfile = authManager.userProfile;
    if (authManager.popupType != PopupType.None || authManager.isRetrievingProfile) {
        return (
            <div className={`w-${isMobile ? "full" : "24 text-xs"} text-center`}>
                <div>{authManager.popupType === PopupType.Logout ? "Logging Out" : "Logging In"}</div>
                <progress className="progress"></progress>
            </div>);
    }

    if (userProfile) {
        if (userProfile.type === UserProfileType.NotConfigured) {
            return (
                <>
                    <div className={`w-${isMobile ? "full" : "24 text-xs"} text-center`}>
                        <div>Configuring</div>
                        <progress className="progress"></progress>
                    </div>
                    <div className="text-base-content">
                        <Dialog isOpen={true}>
                            <h3 className="font-bold text-lg">Sign Up!</h3>
                            <p className="py-4">
                                Add the sign-up form here!
                            </p>
                            <button className="btn btn-primary" onClick={() => {
                                authManager.logout();
                            }}>
                                <FontAwesomeIcon icon="fas faCheck" />&nbsp;Sign Out
                            </button> 
                        </Dialog>
                    </div>
                </>);
        }

        return (
            <div className={`dropdown dropdown-${isMobile ? "start" : "end"}`}>
                <div tabIndex={0} role="button" className="btn btn-primary m-1">
                    <FontAwesomeIcon icon="fas faUser" />&nbsp;{userProfile.displayName}
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
        return (
            <button className="btn btn-primary" disabled={!authManager.isReady || authManager.popupType != PopupType.None} onClick={() => {
                authManager.login();
            }}>
                Sign In / Sign-Up
            </button>);
    }
}