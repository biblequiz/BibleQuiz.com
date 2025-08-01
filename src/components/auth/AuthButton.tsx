import { useStore } from "@nanostores/react";
import { sharedAuthManager } from "../../utils/SharedState";
import FontAwesomeIcon from "../FontAwesomeIcon";

export default function AuthButton() {

    const authManager = useStore(sharedAuthManager);

    const userProfile = authManager.userProfile;
    if (userProfile) {
        return (
            <div>
                <FontAwesomeIcon icon="fas faUser" />&nbsp;{userProfile.displayName}
                <button className="btn btn-warning btn-sm" disabled={authManager.isPopupOpen} onClick={() => {
                    authManager.logout();
                }}>
                    <FontAwesomeIcon icon="fas faArrowRightFromBracket" />
                </button>
            </div>);
    }
    else {
        return (
            <button className="btn btn-primary" disabled={!authManager.isReady || authManager.isPopupOpen} onClick={() => {
                authManager.login();
            }}>
                Sign In
            </button>);
    }
}