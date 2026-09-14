import { useEffect } from "react";
import ProtectedRoute from "components/auth/ProtectedRoute";
import type { UserAccountProfile } from "types/AuthManager";
import type { DistrictInfo } from "types/RegionAndDistricts";
import SeasonAwardsPage from "./SeasonAwardsPage";

interface Props {
    districts: DistrictInfo[];
    loadingElementId: string;
}

function hasSeasonAwardsPermission(
    profile: UserAccountProfile,
    districts: DistrictInfo[],
): boolean {
    if (profile.churchPermissions && profile.churchPermissions.size > 0) {
        return true;
    }

    return districts.some((district) =>
        profile.hasDistrictPermission(district.id, district.regionId, "agtbq"));
}

export default function SeasonAwardsProtectedApp({ districts, loadingElementId }: Props) {
    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) {
            fallback.style.display = "none";
        }
    }, [loadingElementId]);

    return (
        <ProtectedRoute permissionCheck={(profile) => hasSeasonAwardsPermission(profile, districts)}>
            <SeasonAwardsPage districts={districts} />
        </ProtectedRoute>
    );
}