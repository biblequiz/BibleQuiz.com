import { useStore } from "@nanostores/react";
import { sharedAuthManager } from "../utils/SharedState";
import { useEffect } from "react";
import { getOptionalPermissionCheckAlert } from "./auth/PermissionCheckAlert";
import { UserProfileType } from "../types/AuthManager";
import ProfilePersonDetails from "./ProfilePersonDetails";

interface Props {
    loadingElementId: string;
}

export default function ProfilePage({ loadingElementId }: Props) {

    const authManager = useStore(sharedAuthManager);

    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) fallback.style.display = "none";
    }, [loadingElementId]);

    const permissionAlert = getOptionalPermissionCheckAlert(authManager, true);
    if (permissionAlert) {
        return permissionAlert;
    }

    if (authManager.userProfile!.type === UserProfileType.NotConfigured) {
        return (
            <>

                <p>
                    You're almost done setting up your BibleQuiz.com account. You just need to finish
                    setting up your profile.
                </p>
                <ProfilePersonDetails />
            </>);
    }

    return (<div>Show the Profile</div>);
}