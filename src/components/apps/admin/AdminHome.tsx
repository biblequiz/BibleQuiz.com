import { useEffect } from "react";
import ProtectedRoute from "components/auth/ProtectedRoute";
import { AuthManager } from "types/AuthManager";
import { canManagePermissions } from "utils/Authorization";

function AdminTools() {
    const auth = AuthManager.useNanoStore();
    const profile = auth.userProfile!;
    const tools = [
        profile.canManageEvents
            ? {
                  title: "Manage Events",
                  description:
                      "Create events and manage registration, scoring, reports, and communication.",
                  href: "/manage-events/",
              }
            : null,
        !auth.isImpersonating && canManagePermissions(profile)
            ? {
                  title: "Permissions",
                  description:
                      "Manage administrative access for organizations, regions, districts, and churches.",
                  href: "/admin/permissions/",
              }
            : null,
        !auth.isImpersonating && profile.isPayoutManager
            ? {
                  title: "Payouts",
                  description:
                      "Reconcile event payouts and site fees.",
                  href: "/admin/payouts/",
              }
            : null,
    ].filter((tool): tool is NonNullable<typeof tool> => tool !== null);

    if (tools.length === 0) {
        return (
            <div role="alert" className="alert alert-info">
                No Admin tools are available for this account.
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tools.map((tool) => (
                <a
                    key={tool.href}
                    href={tool.href}
                    className="card border border-base-300 bg-base-100 shadow-sm no-underline"
                >
                    <div className="card-body">
                        <h2 className="card-title">{tool.title}</h2>
                        <p>{tool.description}</p>
                        <span className="font-bold text-primary">Open →</span>
                    </div>
                </a>
            ))}
        </div>
    );
}

export default function AdminHome() {
    useEffect(() => {
        const fallback = document.getElementById("admin-fallback");
        if (fallback) {
            fallback.style.display = "none";
        }
    }, []);

    return (
        <ProtectedRoute>
            <AdminTools />
        </ProtectedRoute>
    );
}
