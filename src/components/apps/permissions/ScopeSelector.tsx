import { PersonPermissionScope } from 'types/services/PermissionsService';
import FontAwesomeIcon from 'components/FontAwesomeIcon';
import type { UserAccountProfile } from 'types/AuthManager';

interface Props {
    currentScope: PersonPermissionScope | null;
    onScopeChange: (scope: PersonPermissionScope | null) => void;
    userProfile: UserAccountProfile;
}

export default function ScopeSelector({ currentScope, onScopeChange, userProfile }: Props) {
    const hasOrgPermission = userProfile.organizationPermission !== null;
    const hasRegionPermission = hasOrgPermission || (userProfile.regionPermissions !== null && Object.keys(userProfile.regionPermissions).length > 0);
    const hasDistrictPermission = hasRegionPermission || (userProfile.districtPermissions !== null && Object.keys(userProfile.districtPermissions).length > 0);
    const hasChurchPermission = hasDistrictPermission || (userProfile.churchPermissions !== null && userProfile.churchPermissions.size > 0);

    return (
        <div className="flex flex-wrap gap-2">
            {hasOrgPermission && (
                <button
                    className={`btn btn-sm mt-0 mb-0 ${currentScope === PersonPermissionScope.Organization ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => onScopeChange(PersonPermissionScope.Organization)}
                >
                    <FontAwesomeIcon icon="fas faGlobe" />
                    Administrators
                </button>
            )}

            {hasRegionPermission && (
                <button
                    className={`btn btn-sm mt-0 mb-0 ${currentScope === PersonPermissionScope.Region ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => onScopeChange(PersonPermissionScope.Region)}
                >
                    <FontAwesomeIcon icon="fas faMap" />
                    Regions
                </button>
            )}

            {hasDistrictPermission && (
                <button
                    className={`btn btn-sm mt-0 mb-0 ${currentScope === PersonPermissionScope.District ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => onScopeChange(PersonPermissionScope.District)}
                >
                    <FontAwesomeIcon icon="fas faMapPin" />
                    Districts
                </button>
            )}

            {hasChurchPermission && (
                <button
                    className={`btn btn-sm mt-0 mb-0 ${currentScope === PersonPermissionScope.Church ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => onScopeChange(PersonPermissionScope.Church)}
                >
                    <FontAwesomeIcon icon="fas faChurch" />
                    Churches
                </button>
            )}

            {hasOrgPermission && (
                <button
                    className={`btn btn-sm mt-0 mb-0 ${currentScope === null ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => onScopeChange(null)}
                >
                    <FontAwesomeIcon icon="fas faPeopleGroup" />
                    People
                </button>
            )}
        </div>
    );
}
