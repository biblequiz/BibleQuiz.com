import { Outlet } from 'react-router-dom';
import NotAuthenticatedSection from './NotAuthenticatedSection';
import { AuthManager, UserProfileType } from '../../types/AuthManager';
import CompleteProfileSection from './CompleteProfileSection';

interface Props {
}

export default function ProtectedRoute({ }: Props) {

    const authManager = AuthManager.useNanoStore();

    // The user isn't signed in at all.
    const currentProfile = authManager.userProfile;
    if (!currentProfile) {
        return <NotAuthenticatedSection />;
    }

    // The user is signed in, but they haven't completed their profile setup.
    if (currentProfile.type === UserProfileType.NotConfigured) {
        return <CompleteProfileSection />;
    }

    return <Outlet />;
}