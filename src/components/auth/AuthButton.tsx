import { useStore } from "@nanostores/react";
import { sharedAuthManager } from "../../utils/SharedState";
import FontAwesomeIcon from "../FontAwesomeIcon";

export default function AuthButton() {

    const authManager = useStore(sharedAuthManager);

    const userProfile = authManager.userProfile;
    if (userProfile) {
        return (

            <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-primary m-1">
                    <FontAwesomeIcon icon="fas faUser" />&nbsp;{userProfile.displayName}
                </div>
                <ul
                    tabIndex={0}
                    className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm"
                >
                    <li className="text-base-content">
                        <a onClick={() => {
                            if (!authManager.isPopupOpen) {
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
            <button className="btn btn-primary" disabled={!authManager.isReady || authManager.isPopupOpen} onClick={() => {
                authManager.login();
            }}>
                Sign In / Sign-Up
            </button>);
    }
}