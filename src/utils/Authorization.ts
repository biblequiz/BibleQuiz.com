import type { UserAccountProfile } from "types/AuthManager";

export function canManagePermissions(profile: UserAccountProfile): boolean {
    return (
        !!profile.organizationPermission ||
        !!(
            profile.regionPermissions &&
            Object.keys(profile.regionPermissions).length > 0
        ) ||
        !!(
            profile.districtPermissions &&
            Object.keys(profile.districtPermissions).length > 0
        ) ||
        !!(profile.churchPermissions && profile.churchPermissions.size > 0)
    );
}
