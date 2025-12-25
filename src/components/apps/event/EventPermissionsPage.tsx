import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { PermissionsService, PersonPermissionScope, PersonPermissionType, type PersonPermission } from "types/services/PermissionsService";
import type { EventProviderContext } from "./EventProvider";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import PermissionCard from "./PermissionCard";
import PaginationControl from "./PaginationControl";
import ConfirmationDialog from "components/ConfirmationDialog";
import PersonLookupDialog from "components/PersonLookupDialog";
import { PersonParentType } from "types/services/PeopleService";

interface Props {
}

enum DialogState {
    None,
    Adding,
    Confirming,
    Removing
};

export default function EventPermissionsPage({ }: Props) {
    const {
        auth,
        info,
        eventId
    } = useOutletContext<EventProviderContext>();

    const [currentEventId, setCurrentEventId] = useState<string | undefined>(undefined);
    const [permissions, setPermissions] = useState<PersonPermission[] | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingError, setLoadingError] = useState<string | undefined>(undefined);
    const [pageNumber, setPageNumber] = useState<number | undefined>(undefined);
    const [pageCount, setPageCount] = useState<number | undefined>(undefined);
    const [dialogState, setDialogState] = useState<DialogState>(DialogState.None);

    const [deletingError, setDeletingError] = useState<string | undefined>(undefined);
    const [deleteIndex, setDeleteIndex] = useState<number | undefined>(undefined);

    useEffect(() => {
        const newPageNumber = eventId === currentEventId ? (pageNumber ?? 0) : 0;
        setIsLoading(true);

        if (!isLoading) {
            PermissionsService.getPermissions(
                auth,
                25, // Page Size
                newPageNumber,
                PersonPermissionScope.Meet,
                undefined, // Region ID
                undefined, // District ID
                undefined, // Church ID
                eventId)
                .then(page => {
                    setPageCount(page.PageCount ?? 0);
                    setPageNumber(newPageNumber);
                    setPermissions(page.Items);
                    setIsLoading(false);
                })
                .catch(err => {
                    setIsLoading(false);
                    setLoadingError(err.message ?? "Unknown error");
                });
            if (eventId !== currentEventId) {
                setCurrentEventId(eventId);
                setPageNumber(0);
            }
        }
    }, [eventId, pageNumber]);

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
    else if (loadingError) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <FontAwesomeIcon icon="fas faTriangleExclamation" />
                            <span className="ml-4">Error</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            {loadingError}
                        </p>
                    </div>
                </div>
            </div>);
    }

    const addPersonButton = (
        <button
            type="button"
            className="btn btn-primary mt-0"
            disabled={dialogState !== DialogState.None}
            onClick={() => setDialogState(DialogState.Adding)}>
            <FontAwesomeIcon icon="fas faPlus" />&nbsp;Add Person
        </button>);

    return (
        <>
            {deletingError && (
                <div className="alert alert-warning rounded-2xl mb-4">
                    <div
                        className="w-full"
                        dangerouslySetInnerHTML={{ __html: deletingError }} />
                </div>)}
            <div className="mb-0">
                {addPersonButton}
            </div>
            <div className="mt-4">
                {permissions.length > 0 && (
                    <div className="flex flex-wrap gap-4">
                        {permissions.map((permission, index) => {
                            return (
                                <PermissionCard
                                    key={`permission_${permission.Requestor.Id}`}
                                    permission={permission}
                                    isRemoving={dialogState !== DialogState.None}
                                    onRemove={() => {
                                        setDeleteIndex(index);
                                        setDialogState(DialogState.Confirming);
                                    }} />);
                        })}
                    </div>)}
                {permissions.length === 0 && (
                    <div role="alert" className="alert alert-info alert-outline">
                        <FontAwesomeIcon icon="far faLightbulb" />
                        <span className="text-base-content">
                            No permissions have been assigned for this event.
                        </span>
                    </div>)}
            </div>
            <PaginationControl
                currentPage={pageNumber ?? 0}
                pages={pageCount ?? 0}
                setPage={setPageNumber}
                isLoading={dialogState !== DialogState.None} />
            <div className="mt-4">
                {addPersonButton}
            </div>
            {dialogState === DialogState.Confirming && (
                <ConfirmationDialog
                    title="Remove Permission"
                    yesLabel="Remove"
                    onYes={() => {
                        PermissionsService.delete(
                            auth,
                            permissions[deleteIndex!].Id!)
                            .then(() => {
                                const newPermissions = permissions.filter((_, i) => i !== deleteIndex);
                                setPermissions(newPermissions);
                                setDialogState(DialogState.None);
                                setDeletingError(undefined);
                                setDeleteIndex(undefined);
                            })
                            .catch(err => {
                                setDialogState(DialogState.None);
                                setDeletingError(err.message ?? "Unknown error");
                                setDeleteIndex(undefined);
                            });
                    }}
                    noLabel="Cancel"
                    onNo={() => {
                        setDialogState(DialogState.None);
                        setDeleteIndex(undefined);
                    }}
                >
                    Are you sure you want to remove
                    remove {permissions[deleteIndex!].Requestor.FirstName} {permissions[deleteIndex!].Requestor.LastName}'s
                    permission to manage the {permissions[deleteIndex!].Label}?
                </ConfirmationDialog>)}
            {dialogState === DialogState.Adding && (
                <PersonLookupDialog
                    title="Add Permission for Person"
                    description="People who are eligible for the event (e.g. same district/region) are listed below."
                    parentType={PersonParentType.Meet}
                    parentId={eventId}
                    eventId={eventId}
                    excludeWithScope={true}
                    includeOnlyUsers={true}
                    includeAllUsers={true}
                    onSelect={p => {
                        if (p) {
                            PermissionsService.createOrUpdate(
                                auth,
                                PersonPermissionScope.Meet,
                                PersonPermissionType.Administrator,
                                p.Id!,
                                null,
                                undefined,
                                undefined,
                                undefined,
                                eventId)
                                .then(permission => {
                                    const newPermissions = [...permissions, permission];

                                    setDialogState(DialogState.None);
                                    setPermissions(newPermissions);
                                    setIsLoading(false);
                                    setLoadingError(undefined);
                                })
                                .catch(err => {
                                    setDialogState(DialogState.None);
                                    setIsLoading(false);
                                    setLoadingError(err.message ?? "Unknown error");
                                });
                        }
                        else {
                            setDialogState(DialogState.None);
                            setIsLoading(false);
                            setLoadingError(undefined);
                        }
                    }} />)}
        </>);
}