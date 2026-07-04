import { useEffect } from 'react';
import type { UserAccountProfile } from 'types/AuthManager';
import ProtectedRoute from 'components/auth/ProtectedRoute';
import PermissionsPage from './PermissionsPage';

function hasPermissions(profile: UserAccountProfile): boolean {
    return !!profile.organizationPermission ||
    !!(profile.regionPermissions && Object.keys(profile.regionPermissions).length > 0) ||
    !!(profile.districtPermissions && Object.keys(profile.districtPermissions).length > 0) ||
    !!(profile.churchPermissions && profile.churchPermissions.size > 0);
}

export default function PermissionsProtectedApp() {
    // Hide loading fallback once the React app mounts, even for auth gate states.
    useEffect(() => {
        const fallback = document.getElementById('permissions-fallback');
        if (fallback) {
            fallback.style.display = 'none';
        }
    }, []);

    return (
        <ProtectedRoute permissionCheck={hasPermissions}>
            <PermissionsPage />
        </ProtectedRoute>
    );
}