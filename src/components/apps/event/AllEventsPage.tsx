import { AuthManager } from "types/AuthManager";

interface Props {
}

export default function AllEventsPage({ }: Props) {
    const auth = AuthManager.useNanoStore();

    return (
        <>
            <div>
                <b>All Events Page</b>
            </div>
            <p>
                This page allows an event coordinator to select their event.
                TODO: This page should use the same filtering as the home page and results page, but show events from all seasons
                      that the user has permissions for. It needs to have pagination though.
                TODO: Events should have their scope changed (not the URL) based on the teams actually part of the event. That way,
                      it doesn't pollute the other events.
                TODO: Home page and results filters should be:
                      - My District or Region (based on selection of district or region or church (if signed in)) OR
                        All Districts / Regions my church is eligible to (if signed in) OR
                        all events
                      - Search text box
                      - Each selected item should appear as a tag so the user can remove them if they wish.
                      - The same filters should flow across all the pages.
                TODO: Eliminate the selection bar for different types of competition after the scoping has changed. This will make it
                      easier for people to select events.
                TODO: The list of events in All Events and Home Page should include past events. The Home Page should include events
                      in the last two weeks.
            </p>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}