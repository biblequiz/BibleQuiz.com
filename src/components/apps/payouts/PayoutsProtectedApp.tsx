import { useEffect } from "react";
import { type UserAccountProfile } from "types/AuthManager";
import ProtectedRoute from "components/auth/ProtectedRoute";
import PayoutsPage from "components/apps/payouts/PayoutsPage";

function hasPayoutAccess(profile: UserAccountProfile): boolean {
    return profile.isPayoutManager;
}

export default function PayoutsProtectedApp() {

    // Hide loading fallback once the React app mounts, even for auth gate states.
    useEffect(() => {
        const fallback = document.getElementById("payouts-fallback");
        if (fallback) {
            fallback.style.display = "none";
        }
    }, []);

    return (
        <ProtectedRoute permissionCheck={hasPayoutAccess}>
            <PayoutsPage />
        </ProtectedRoute>
    );
}
