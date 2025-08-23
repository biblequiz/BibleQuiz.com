import { useStore } from "@nanostores/react";
import { sharedAuthManager } from "../utils/SharedState";
import { useEffect } from "react";
import { getOptionalPermissionCheckAlert } from "./auth/PermissionCheckAlert";
import { AuthManager, UserProfileType } from "../types/AuthManager";
import ProfilePersonDetails from "./ProfilePersonDetails";

interface Props {
    loadingElementId: string;
}

export default function ProfilePage({ loadingElementId }: Props) {

    const authManager = AuthManager.useNanoStore();

    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) fallback.style.display = "none";
    }, [loadingElementId]);

    const permissionAlert = getOptionalPermissionCheckAlert(authManager);
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

    return (
        <>
            <div>
                We are in the process of merging the old Registration site with BibleQuiz.com. This page is
                still in progress.
            </div>
            <div>
                <b>Name: </b> {authManager.userProfile!.displayName}<br />
                <b>Type: </b> {UserProfileType[authManager.userProfile!.type!]}<br />
                <b>JBQ Admin: </b> {authManager.userProfile!.isJbqAdmin ? "true" : "false"}<br />
                <b>TBQ Admin: </b> {authManager.userProfile!.isTbqAdmin ? "true" : "false"}<br />
                <b>User Name: </b> {authManager.userProfile!.authTokenProfile?.email}
            </div>
        </>);
}