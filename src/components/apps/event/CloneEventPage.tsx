import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { PermissionsService, PersonPermission, PersonPermissionScope } from "types/services/PermissionsService";
import { NEW_ID_PLACEHOLDER, type EventProviderContext } from "./EventProvider";
import { EventsService, type EventInfo } from "types/services/EventsService";
import { sharedDirtyWindowState } from "utils/SharedState";
import EventLookupDialog from "./EventLookupDialog";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import { set } from "date-fns";

interface Props {
}

export default function CloneEventPage({ }: Props) {

    const {
        auth,
        info,
        setEventTitle,
        setClonePermissionsFromEventId,
        setLatestEvent,
        eventId
    } = useOutletContext<EventProviderContext>();

    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [permissions, setPermissions] = useState<PersonPermission[] | undefined>(undefined);
    const [includePermissions, setIncludePermissions] = useState<boolean>(true);
    const [allowRegistrationOverwrite, setAllowRegistrationOverwrite] = useState<boolean>(false);
    const [copyFromEvent, setCopyFromEvent] = useState<{ id: string, label: string } | undefined>(undefined);
    const [isSelecting, setIsSelecting] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [copiedRegistrationsCount, setCopiedRegistrationsCount] = useState<number | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);

        if (!isLoading) {
            PermissionsService.getPermissions(
                auth,
                100, // Page Size
                0,
                PersonPermissionScope.Meet,
                undefined, // Region ID
                undefined, // District ID
                undefined, // Church ID
                eventId)
                .then(page => {
                    setPermissions(page.Items);
                    setIncludePermissions(true);
                    setIsLoading(false);
                })
                .catch(err => {
                    setIsLoading(false);
                    setError(err.message ?? "Unknown error");
                });
        }
    }, [eventId]);

    if (isLoading || !permissions) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">Loading Event's Permissions ...</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            The event's permissions are being downloaded. This should just take a second or two ...
                        </p>
                    </div>
                </div>
            </div>);
    }

    return (
        <div className="mt-4">
            {error && (
                <div className="alert alert-warning rounded-2xl mb-4">
                    <div
                        className="w-full"
                        dangerouslySetInnerHTML={{ __html: error }} />
                </div>)}
            <div className="flex flex-wrap gap-4">
                <div
                    className="card live-events-card w-full md:w-128 card-sm shadow-sm border-2 border-solid mt-0 relative">
                    <div className="card-body p-2 pl-4">
                        <div className="flex items-start gap-4">
                            <FontAwesomeIcon
                                icon="fas faList"
                                classNames={["text-xl", "mt-2"]} />
                            <div className="flex-1 pr-6 mt-2">
                                <h2 className="card-title mb-0 mt-1">
                                    Copy Settings to New Event
                                </h2>
                            </div>
                        </div>
                        <p className="mt-0 mb-0">
                            Your event will be copied with identical settings (except for the dates), but will not include the registrations.
                        </p>
                        {permissions.length > 0 && (
                            <div className="w-full mt-2">
                                <label className="label">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-sm checkbox-info"
                                        checked={includePermissions}
                                        onChange={e => setIncludePermissions(e.target.checked)}
                                    />
                                    <span className="mt-0 mb-0 text-base-content">
                                        Include permissions for event:
                                    </span>
                                </label>
                                <ul className="mt-0 mb-2">
                                    {permissions.map((permission, index) => (
                                        <li key={`permission_${permission.Id}`}>
                                            {permission.Requestor.FirstName} {permission.Requestor.LastName}
                                        </li>))}
                                </ul>
                            </div>)}
                        <div className="w-full mt-0">
                            <button
                                type="button"
                                className="btn btn-success w-full mt-0 mb-0 pt-1 pb-1"
                                disabled={isSelecting || isCopying}
                                onClick={() => {
                                    const clonedEvent: EventInfo = structuredClone(info)!;
                                    clonedEvent.Id = undefined;
                                    clonedEvent.Name += " (Copy)";
                                    clonedEvent.IsHidden = false;

                                    if (null != clonedEvent.Divisions) {
                                        for (let division of clonedEvent.Divisions) {
                                            division.Id = undefined;
                                        }
                                    }

                                    if (null != clonedEvent.Fields) {
                                        for (let field of clonedEvent.Fields) {
                                            field.Id = undefined;
                                        }
                                    }

                                    if (null != clonedEvent.Forms) {
                                        for (let form of clonedEvent.Forms) {
                                            form.Id = undefined;
                                        }
                                    }

                                    setEventTitle(clonedEvent.Name);
                                    setLatestEvent(clonedEvent);
                                    setClonePermissionsFromEventId(includePermissions ? eventId : undefined);

                                    navigate(`/${NEW_ID_PLACEHOLDER}/registration/general`);
                                    sharedDirtyWindowState.set(true);
                                }}>
                                <FontAwesomeIcon icon="fas faClone" />
                                Create Copy of Event
                            </button>
                        </div>
                    </div>
                </div>
                <div
                    className="card live-events-card w-full md:w-128 card-sm shadow-sm border-2 border-solid mt-0 relative">
                    <div className="card-body p-2 pl-4">
                        <div className="flex items-start gap-4">
                            <FontAwesomeIcon
                                icon="fas faUserPen"
                                classNames={["text-xl", "mt-2"]} />
                            <div className="flex-1 pr-6 mt-2">
                                <h2 className="card-title mb-0 mt-1">
                                    Copy Registrations from Previous Event
                                </h2>
                            </div>
                        </div>
                        <div className="relative flex gap-2">
                            <span className="input input-bordered grow text-base-500 overflow-hidden whitespace-nowrap text-ellipsis mt-0 mb-0 pt-1 pb-1">
                                {copyFromEvent?.label ?? "Lookup Event"}
                            </span>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => {
                                    setIsSelecting(true);
                                    setCopiedRegistrationsCount(undefined);
                                }}
                                disabled={isSelecting || isCopying}
                            >
                                <FontAwesomeIcon icon="fas faSearch" />
                                Lookup Event
                            </button>
                        </div>
                        <div className="w-full mt-2">
                            <label className="label">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm checkbox-info"
                                    checked={allowRegistrationOverwrite}
                                    disabled={!copyFromEvent}
                                    onChange={e => setAllowRegistrationOverwrite(e.target.checked)}
                                />
                                <span className="mt-0 mb-0 text-base-content">
                                    I understand existing registrations will be overwritten and <b>CANNOT</b> be recovered.
                                </span>
                            </label>
                        </div>
                        {copiedRegistrationsCount !== undefined && (
                            <div className="alert alert-success rounded-2xl mt-0 mb-0">
                                <div className="w-full">
                                    <FontAwesomeIcon icon="fas faCheckCircle" classNames={["mr-2"]} />
                                    Successfully copied {copiedRegistrationsCount} registrations from the selected event.
                                </div>
                            </div>)}
                        <div className="w-full mt-0">
                            <button
                                type="button"
                                className="btn btn-info w-full mt-0 mb-0 pt-1 pb-1 text-white"
                                disabled={isSelecting || isCopying || !allowRegistrationOverwrite || !copyFromEvent}
                                onClick={() => {
                                    setIsCopying(true);
                                    EventsService.replaceRegistrations(
                                        auth,
                                        copyFromEvent!.id,
                                        eventId)
                                        .then(updatedRegistrations => {
                                            setCopiedRegistrationsCount(updatedRegistrations);
                                            setCopyFromEvent(undefined);
                                            setAllowRegistrationOverwrite(false);
                                            setIsCopying(false);
                                            setError(null);

                                            const clonedEvent = structuredClone(info)!;
                                            (clonedEvent as any).HasAnyRegistrations = updatedRegistrations > 0;
                                            setLatestEvent(clonedEvent);
                                        })
                                        .catch(err => {
                                            setIsCopying(false);
                                            setError(err.message ?? "Unknown error");
                                        });
                                }}>
                                <FontAwesomeIcon icon="fas faClone" />
                                Copy Registrations from Event
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {isSelecting && (
                <EventLookupDialog
                    typeId={info!.TypeId}
                    season={DataTypeHelpers.getSeasonFromDate(info!.StartDate)!}
                    excludeEventId={eventId}
                    onSelect={e => {
                        if (e) {
                            setCopyFromEvent({ id: e.Id!, label: e.Name });
                        }
                        else {
                            setCopyFromEvent(undefined);
                        }

                        setAllowRegistrationOverwrite(false);
                        setIsSelecting(false);
                    }}
                />)}
        </div>);
}