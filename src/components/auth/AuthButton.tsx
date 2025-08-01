import { useStore } from "@nanostores/react";
import { sharedAuthManager } from "../../utils/SharedState";

export default function AuthButton() {

    const authManager = useStore(sharedAuthManager);

    const userProfile = authManager.userProfile;
    if (userProfile) {
        return (
            <button className="btn btn-warning" disabled={authManager.isPopupOpen} onClick={() => {
                authManager.logout();
            }}>
                Sign Out for {userProfile.displayName}
            </button>);
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