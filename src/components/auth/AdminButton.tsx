import { AuthManager, UserProfileType } from "types/AuthManager";
import { canManagePermissions } from "utils/Authorization";

export default function AdminButton() {
    const auth = AuthManager.useNanoStore();
    const profile = auth.userProfile;

    if (!profile || profile.type === UserProfileType.NotConfigured) {
        return null;
    }

    const showAdmin =
        profile.canManageEvents ||
        (!auth.isImpersonating &&
            (canManagePermissions(profile) || profile.isPayoutManager));

    if (!showAdmin) {
        return null;
    }

    return (
        <a className="btn btn-ghost whitespace-nowrap" href="/admin/">
            Admin
        </a>
    );
}
