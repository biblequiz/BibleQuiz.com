import type { JSX } from "react";
import FontAwesomeIcon from "../FontAwesomeIcon";
import { AuthManager, UserProfileType } from "../../types/AuthManager";

export function getOptionalPermissionCheckAlert(authManager: AuthManager, isProfilePage?: boolean): JSX.Element | null {

    // The user isn't signed in at all.
    const currentProfile = authManager.userProfile;
    if (!currentProfile) {
        return (<div role="alert" className="alert alert-warning">
            <FontAwesomeIcon icon="fas faTriangleExclamation" />
            <div>
                <b>Warning: </b> You must be logged in to view this page. Click the Sign In / Sign Up
                button at the top to sign in with your BibleQuiz.com account.
            </div>
        </div>);
    }

    // The user is signed in, but they haven't completed their profile setup. If this isn't the profile page,
    // they don't have permissions to view this page.
    if (!isProfilePage &&
        authManager.userProfile.type === UserProfileType.NotConfigured) {
        return (<div role="alert" className="alert alert-warning">
            <FontAwesomeIcon icon="fas faTriangleExclamation" />
            <div>
                <b>Warning: </b> You're almost done setting up your BibleQuiz.com account. You
                just need to <a href="/profile" className="link link-primary">finish setting up your profile</a>.
            </div>
        </div>);
    }

    return null;
}