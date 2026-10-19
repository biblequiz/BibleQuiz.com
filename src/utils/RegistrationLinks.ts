/**
 * Gets the path of an event's public registration page, for links within the site.
 *
 * @param eventId Id for the event.
 * @param churchId Id for a church, to open that church's registration.
 *
 * @returns Path of the registration page.
 */
export function getRegistrationPath(eventId: string, churchId?: string): string {
    const path = `/register/#/${encodeURIComponent(eventId)}`;
    return churchId ? `${path}/${encodeURIComponent(churchId)}` : path;
}

/**
 * Gets the full address of an event's public registration page, for sharing outside the site. It uses the site's
 * configured address, so a link copied from a preview deployment or localhost still points at the real site, and
 * falls back to the current site if that isn't configured.
 *
 * @param eventId Id for the event.
 *
 * @returns Full address of the registration page.
 */
export function getRegistrationUrl(eventId: string): string {
    return new URL(getRegistrationPath(eventId), import.meta.env.SITE || window.location.origin).href;
}
