import { useEffect } from 'react';
import { AuthManager } from 'types/AuthManager';
import ProtectedRoute from 'components/auth/ProtectedRoute';
import ProfilePage from './ProfilePage';

export default function ProfileProtectedApp() {
    const authManager = AuthManager.useNanoStore();

    // Hide loading fallback once the React app mounts, even for auth gate states.
    useEffect(() => {
        const fallback = document.getElementById('profile-fallback');
        if (fallback) {
            fallback.style.display = 'none';
        }
    }, []);

    return (
        <ProtectedRoute>
            <ProfilePage isReadOnly={authManager.isImpersonating} />
        </ProtectedRoute>
    );
}
