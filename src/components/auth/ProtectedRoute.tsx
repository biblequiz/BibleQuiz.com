import { Outlet } from 'react-router-dom';
import NotAuthenticatedSection from './NotAuthenticatedSection';
import { AuthManager, UserAccountProfile, UserProfileType } from 'types/AuthManager';
import CompleteProfileSection, { type StudyHubSignUpOptions } from './CompleteProfileSection';
import InsufficientPermissionsSection from './InsufficientPermissionsSection';

interface Props {
    permissionCheck?: (profile: UserAccountProfile) => boolean;
    children?: React.ReactNode;

    /** Set only on the Study Hub sign-up page; passed to the sign-up form. */
    studyHub?: StudyHubSignUpOptions;

    /** Shown in place of the standard sign-in prompt when the user isn't signed in (optional). */
    notAuthenticated?: React.ReactNode;
}

export default function ProtectedRoute({ permissionCheck, children, studyHub, notAuthenticated }: Props) {

    const authManager = AuthManager.useNanoStore();
    authManager.showLoginWindowFromBackground();

    // The user isn't signed in at all.
    const currentProfile = authManager.userProfile;
    if (!currentProfile) {
        return notAuthenticated ?? <NotAuthenticatedSection />;
    }

    // The user is signed in, but they haven't completed their profile setup.
    if (currentProfile.type === UserProfileType.NotConfigured) {
        return <CompleteProfileSection studyHub={studyHub} />;
    }

    if (permissionCheck && !permissionCheck(currentProfile)) {
        return <InsufficientPermissionsSection />;
    }

    if (children) {
        return children;
    }
    else {
        return <Outlet />;
    }
}