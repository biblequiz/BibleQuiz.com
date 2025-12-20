import { AuthManager } from "types/AuthManager";
import type { EventProviderContext } from "./EventProvider";
import { useOutletContext } from "react-router-dom";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useState } from "react";
import { EventsService } from "types/services/EventsService";

interface Props {
}

export default function DeleteEventPage({ }: Props) {
    const auth = AuthManager.useNanoStore();

    const {
        eventId,
        info } = useOutletContext<EventProviderContext>();

    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | undefined>(undefined);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsDeleting(true);

        return EventsService.delete(auth, info!.Id!)
            .then(() => {
                setIsDeleting(false);
                setDeleteError(undefined);
                window.location.href = "/manage-events";
            })
            .catch(error => {
                setIsDeleting(false);
                setDeleteError(error.message || "An error occured while deleting this event.");
            });
    };

    if (isDeleting) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">Deleting Event ...</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            The event is being deleted. It may take a few hours for the changes to be live
                            on BibleQuiz.com.
                        </p>
                    </div>
                </div>
            </div>);
    }
    else if (deleteError) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <FontAwesomeIcon icon="fas faTriangleExclamation" />
                            <span className="ml-4">Error</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            {deleteError}
                        </p>
                    </div>
                </div>
            </div>);
    }
    else if (info!.HasAnyRegistrations) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <FontAwesomeIcon icon="fas faTriangleExclamation" />
                            <span className="ml-4">Cannot Delete</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            This event cannot be deleted as there are already registrations for it. If you still want
                            to delete it, you must remove all registrations first.
                        </p>
                    </div>
                </div>
            </div>);
    }

    return (
        <form className="space-y-6 mt-0" onSubmit={handleSubmit}>
            <div className="w-full ml-2 mt-4 mb-0">
                <label className="label text-wrap">
                    <input
                        type="checkbox"
                        name="isHidden"
                        className="checkbox checkbox-sm checkbox-info"
                        checked={isConfirmed}
                        onChange={e => setIsConfirmed(e.target.checked)}
                    />
                    <span>
                        I understand that deleting this event is permanent and cannot be undone.
                    </span>
                </label>
            </div>

            <div className="divider mt-0" />

            <button
                type="submit"
                className="btn btn-error m-0"
                disabled={!isConfirmed || isDeleting}>
                <FontAwesomeIcon icon="fas faTrash" />
                Delete Event Permanently
            </button>
        </form>);
}