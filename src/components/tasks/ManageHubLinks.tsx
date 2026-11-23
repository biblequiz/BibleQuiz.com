import FontAwesomeIcon from "components/FontAwesomeIcon";
import { AuthManager } from "types/AuthManager";

interface ManageLink {
    href: string;
    icon: string;
    title: string;
    description: string;
}

/**
 * The entries of the Manage events, people & more hub (Task 6, D15). Each entry is shown to exactly
 * the people who could reach it before this redesign:
 *
 * - People & Permissions: the account menu showed it with any organization, region, district or
 *   church permission, while not impersonating.
 * - Device usage: Manage Events linked it only for organization-level administrators.
 * - Payout Manager: the account menu showed it to payout managers, while not impersonating.
 */
export default function ManageHubLinks() {
    const authManager = AuthManager.useNanoStore();
    const profile = authManager.userProfile;

    const links: ManageLink[] = [
        {
            href: "/manage-events/",
            icon: "fas faCalendarCheck",
            title: "Events & reports",
            description: "Create and run events, scoring and reports",
        },
    ];

    if (profile) {
        const hasPermissions = !authManager.isImpersonating && (!!profile.organizationPermission ||
            (profile.regionPermissions && Object.keys(profile.regionPermissions).length > 0) ||
            (profile.districtPermissions && Object.keys(profile.districtPermissions).length > 0) ||
            (profile.churchPermissions && profile.churchPermissions.size > 0));

        if (hasPermissions) {
            links.push({
                href: "/admin/permissions",
                icon: "fas faShieldHalved",
                title: "People & permissions",
                description: "Who can manage your church, district or region",
            });
        }

        if (profile.organizationPermission) {
            links.push({
                href: "/manage-events/devices/",
                icon: "fas faTabletScreenButton",
                title: "Device usage",
                description: "Scoring devices across the season",
            });
        }

        if (!authManager.isImpersonating && profile.isPayoutManager) {
            links.push({
                href: "/admin/payouts",
                icon: "fas faSackDollar",
                title: "Payout Manager",
                description: "Payouts to event hosts",
            });
        }

        links.push({
            href: "/admin/profile",
            icon: "fas faIdCard",
            title: "My profile",
            description: "Your name, church and contact details",
        });
    }

    links.push({
        href: "/apps/",
        icon: "fas faTabletScreenButton",
        title: "EZScore & other apps",
        description: "Scoring and meet apps to download",
    });

    return (
        <div className="bq-hub">
            {!profile && (
                <div className="bq-card" style={{ alignItems: "center" }}>
                    <span className="bq-chip"><FontAwesomeIcon icon="fas faLock" /></span>
                    <span className="bq-card-text" style={{ flex: 1 }}>
                        <span className="bq-card-title">Sign in to see your tools</span>
                        <span className="bq-card-desc">What you see here depends on what you're allowed to manage.</span>
                    </span>
                    <button type="button" className="btn btn-primary" onClick={() => authManager.login()}>
                        Sign in
                    </button>
                </div>
            )}
            <div className="bq-cards">
                {links.map(link => (
                    <a key={link.href} className="bq-card" href={link.href}>
                        <span className="bq-chip"><FontAwesomeIcon icon={link.icon} /></span>
                        <span className="bq-card-text">
                            <span className="bq-card-title">{link.title}</span>
                            <span className="bq-card-desc">{link.description}</span>
                        </span>
                    </a>
                ))}
            </div>
        </div>);
}
