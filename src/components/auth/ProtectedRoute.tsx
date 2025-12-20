import { Outlet } from 'react-router-dom';
import NotAuthenticatedSection from './NotAuthenticatedSection';
import { AuthManager, UserAccountProfile, UserProfileType } from 'types/AuthManager';
import CompleteProfileSection from './CompleteProfileSection';
import InsufficientPermissionsSection from './InsufficientPermissionsSection';

interface Props {
    permissionCheck?: (profile: UserAccountProfile) => boolean;
    children?: React.ReactNode;
}

export default function ProtectedRoute({ permissionCheck, children }: Props) {

    const authManager = AuthManager.useNanoStore();
    authManager.showLoginWindowFromBackground();

    // The user isn't signed in at all.
    const currentProfile = authManager.userProfile;
    if (!currentProfile) {
        return <NotAuthenticatedSection />;
    }

    // The user is signed in, but they haven't completed their profile setup.
    if (currentProfile.type === UserProfileType.NotConfigured) {
        return <CompleteProfileSection />;
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