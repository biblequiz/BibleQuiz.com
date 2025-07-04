import { EventScoringReport, ScoringReportMeet } from "@types/EventScoringReport";

import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState } from "@utils/SharedState";
import FontAwesomeIcon from "@components/FontAwesomeIcon";

interface MeetAnchorItem {
    label: string;
    teamsId: string | null;
    teamsCount: number | null;
    quizzersId: string | null;
    quizzersCount: number | null;
    lastUpdated: string;
    isReport: boolean;
};

interface MeetAnchorProps {
    items: MeetAnchorItem[];
};

export function MeetAnchorMenu({ items }: MeetAnchorProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 p-3">
            {items.map((item) => (
                <div className="card bg-base-100 shadow-md">
                    <div className="card-body">
                        <h2 className="card-title">{item.label}</h2>
                        <div className="card-actions justify-end">
                            {item.teamsId && (
                                <button className="btn btn-primary">{item.teamsCount} Team(s)</button>
                            )}
                            {item.quizzersId && (
                                <button className="btn btn-primary">{item.quizzersCount} Quizzers(s)</button>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            Last Updated: {item.lastUpdated}
                        </p>
                    </div>
                </div>
            ))
            }
            <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                    <h2 className="card-title">Card Title 2</h2>
                    <p>This is a description for card 2.</p>
                    <div className="card-actions justify-end">
                        <button className="btn btn-primary">Action</button>
                    </div>
                </div>
            </div>

            <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                    <h2 className="card-title">Card Title 3</h2>
                    <p>This is a description for card 3.</p>
                    <div className="card-actions justify-end">
                        <button className="btn btn-primary">Action</button>
                    </div>
                </div>
            </div>
        </div >
    );
}

function formatLastUpdated(meet: ScoringReportMeet): string {
    const lastUpdatedDate = new Date(meet.LastUpdated);
    let lastUpdatedHours = lastUpdatedDate.getHours();
    const lastUpdatedAmPm = lastUpdatedHours >= 12 ? "PM" : "AM";
    const lastUpdatedMinutes = lastUpdatedDate.getMinutes();
    if (lastUpdatedHours > 12) {
        lastUpdatedHours = lastUpdatedHours - 12;
    }

    return `${lastUpdatedDate.getMonth() + 1}/${lastUpdatedDate.getDate()}/${lastUpdatedDate.getFullYear()} ${lastUpdatedHours}:${lastUpdatedMinutes < 10 ? "0" : ""}${lastUpdatedMinutes} ${lastUpdatedAmPm}`;
}

interface EventScoresProps {
    eventId: string;
    event?: EventScoringReport;
};

export function StatsTabItem({ eventId, event }: EventScoresProps) {

    event ??= useStore(sharedEventScoringReportState)?.report;
    if (!event) {
        return (<span>Event is Loading ...</span>);
    }

    const anchors: MeetAnchorItem[] = [];
    const meetItems: JSX.Element[] = event.Report.Meets.map((meet: ScoringReportMeet) => {

        const idSuffix: string = `stats_${meet.DatabaseId}_${meet.MeetId}`;
        const teamsId: string | null = meet.RankedTeams ? "teams" + idSuffix : null;
        const quizzersId: string | null = meet.RankedQuizzers ? "quizzers" + idSuffix : null;
        const lastUpdatedDate = formatLastUpdated(meet);

        anchors.push({
            label: meet.Name,
            teamsId: teamsId,
            teamsCount: meet.RankedTeams ? meet.RankedTeams.length : null,
            quizzersId: quizzersId,
            quizzersCount: meet.RankedQuizzers ? meet.RankedQuizzers.length : null,
            lastUpdated: lastUpdatedDate,
            isReport: meet.IsCombined
        });

        return (
            <div className="columns is-mobile mt-2">
                <div className="column is-four-fifths">
                    <p className="title is-3"><a id={teamsId}>{meet.Name}</a></p>
                    <p className="subtitle is-7"><i>Last Updated: {lastUpdatedDate}</i></p>
                </div>
            </div>);
    });

    return (
        <>
            <MeetAnchorMenu items={anchors} />
            <div className="collapse collapse-arrow bg-base-100 border border-base-300">
                <input type="radio" name="my-accordion-2" />
                <div className="collapse-title font-semibold">How do I create an account?</div>
                <div className="collapse-content text-sm">Click the "Sign Up" button in the top right corner and follow the registration process.</div>
            </div>
            <div className="collapse collapse-arrow bg-base-100 border border-base-300">
                <input type="radio" name="my-accordion-2" />
                <div className="collapse-title font-semibold">I forgot my password. What should I do?</div>
                <div className="collapse-content text-sm">Click on "Forgot Password" on the login page and follow the instructions sent to your email.</div>
            </div>
            <div className="collapse collapse-arrow bg-base-100 border border-base-300">
                <input type="radio" name="my-accordion-2" />
                <div className="collapse-title font-semibold">How do I update my profile information?</div>
                <div className="collapse-content text-sm">Go to "My Account" settings and select "Edit Profile" to make changes.</div>
            </div>
            <ul className="list bg-base-100 rounded-box shadow-md">
                <li className="list-row">
                    <div></div>
                    <div>
                        <div className="text-xl">
                            <FontAwesomeIcon icon="fas faBook" />&nbsp;
                            Individuals
                        </div>
                        <div className="text-xs uppercase font-semibold opacity-60">
                            Report | 343 Quizzers
                        </div>
                    </div>
                </li>

                <li className="list-row">
                    <div><img className="size-10 rounded-box" src="https://img.daisyui.com/images/profile/demo/4@94.webp" /></div>
                    <div>
                        <div>Ellie Beilish</div>
                        <div className="text-xs uppercase font-semibold opacity-60">Bears of a fever</div>
                    </div>
                    <button className="btn btn-square btn-ghost">
                        <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor"><path d="M6 3L20 12 6 21 6 3z"></path></g></svg>
                    </button>
                    <button className="btn btn-square btn-ghost">
                        <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></g></svg>
                    </button>
                </li>

                <li className="list-row">
                    <div><img className="size-10 rounded-box" src="https://img.daisyui.com/images/profile/demo/3@94.webp" /></div>
                    <div>
                        <div>Sabrino Gardener</div>
                        <div className="text-xs uppercase font-semibold opacity-60">Cappuccino</div>
                    </div>
                    <button className="btn btn-square btn-ghost">
                        <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor"><path d="M6 3L20 12 6 21 6 3z"></path></g></svg>
                    </button>
                    <button className="btn btn-square btn-ghost">
                        <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></g></svg>
                    </button>
                </li>

            </ul>
            {meetItems}
        </>);
};

export function ScheduleTabItem({ eventId, event }: EventScoresProps) {

    event ??= useStore(sharedEventScoringReportState)?.report;
    if (!event) {
        return (<span>Event is Loading ...</span>);
    }

    return (
        <div>
            <span>Schedule Tab Loaded: {event.EventName}</span>
        </div>);
};

export function CoordinatorTabItem({ eventId, event }: EventScoresProps) {

    event ??= useStore(sharedEventScoringReportState)?.report;
    if (!event) {
        return (<span>Event is Loading ...</span>);
    }

    return (
        <div>
            <span>Coordinator Tab Loaded: {event.EventName}</span>
        </div>);
};

export function QuestionStatsTabItem({ eventId, event }: EventScoresProps) {

    event ??= useStore(sharedEventScoringReportState)?.report;
    if (!event) {
        return (<span>Event is Loading ...</span>);
    }

    return (
        <div>
            <span>Question Stats Tab Loaded: {event.EventName}</span>
        </div>);
};