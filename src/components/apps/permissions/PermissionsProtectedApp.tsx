import { useEffect } from 'react';
import { AuthManager } from 'types/AuthManager';
import ProtectedRoute from 'components/auth/ProtectedRoute';
import InsufficientPermissionsSection from 'components/auth/InsufficientPermissionsSection';
import PermissionsPage from './PermissionsPage';
import { canManagePermissions } from 'utils/Authorization';

export default function PermissionsProtectedApp() {
    const authManager = AuthManager.useNanoStore();

    // Hide loading fallback once the React app mounts, even for auth gate states.
    useEffect(() => {
        const fallback = document.getElementById('permissions-fallback');
        if (fallback) {
            fallback.style.display = 'none';
        }
    }, []);

    if (authManager.userProfile && authManager.isImpersonating) {
        return (
            <InsufficientPermissionsSection
                title="Permissions Unavailable During Impersonation"
                message="You are currently impersonating another user. Stop impersonating from the account menu before accessing Permissions or changing user permissions."
            />);
    }

    return (
        <ProtectedRoute permissionCheck={canManagePermissions}>
            <PermissionsPage />
        </ProtectedRoute>
    );
}