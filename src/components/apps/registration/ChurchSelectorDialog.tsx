import { useEffect, useRef, useState } from "react";
import { AuthManager } from "types/AuthManager";
import { Church, ChurchesService, ChurchResultFilter } from "types/services/ChurchesService";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import ChurchSettingsDialog from "components/ChurchSettingsDialog";
import { useEscapeToClose } from "hooks/useEscapeToClose";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

interface Props {
    /** Currently-selected church (if any), so it can be marked in the list. */
    currentChurch: Church | null;

    /**
     * Handler invoked when the dialog is dismissed.
     *
     * @param church The newly-selected church, or null if the dialog was
     *   cancelled (caller should fall back to whatever was current before).
     */
    onClose: (church: Church | null) => void;
}

/**
 * Dialog that lists the churches the current user administers and lets
 * them pick one. Footer offers an "Add New Church" button that opens
 * a nested {@link ChurchSettingsDialog}.
 */
export default function ChurchSelectorDialog({ currentChurch, onClose }: Props) {

    const auth = AuthManager.useNanoStore();
    const dialogRef = useRef<HTMLDialogElement>(null);

    const [churches, setChurches] = useState<Church[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isShowingAddDialog, setIsShowingAddDialog] = useState<boolean>(false);

    // When the nested add-church dialog is open, this dialog should ignore Escape.
    useEscapeToClose(() => onClose(null), isShowingAddDialog);

    useEffect(() => {

        setIsLoading(true);
        ChurchesService.getChurches(
            auth,
            100, // page size
            0, // page number
            null, // searchText
            null, // regionId
            null, // districtId
            ChurchResultFilter.IncludeDirectAuthorized)
            .then(page => {
                setChurches(page.Items ?? []);
                setIsLoading(false);
                setError(null);
            })
            .catch(err => {
                setIsLoading(false);
                setError(err?.message || "An error occurred while loading your churches.");
            });
    }, [auth]);

    const formatChurchLocation = (church: Church): string | null => {
        const city = church.PhysicalAddress?.City;
        const state = church.PhysicalAddress?.State;
        if (DataTypeHelpers.isNullOrEmpty(city) && DataTypeHelpers.isNullOrEmpty(state)) {
            return null;
        }
        if (DataTypeHelpers.isNullOrEmpty(city)) {
            return state;
        }
        if (DataTypeHelpers.isNullOrEmpty(state)) {
            return city;
        }
        return `${city}, ${state}`;
    };

    return (
        <>
            <dialog ref={dialogRef} className="modal" open>
                <div className="modal-box w-11/12 max-w-full md:w-3/4 lg:w-1/2">
                    <h3 className="font-bold text-lg">Select Church</h3>
                    <button
                        type="button"
                        className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                        aria-label="Close"
                        onClick={() => onClose(null)}>
                        ✕
                    </button>

                    {error && (
                        <div role="alert" className="alert alert-error mt-2 mb-2 w-full">
                            <FontAwesomeIcon icon="fas faCircleExclamation" />
                            <div>
                                <b>Error: </b> {error}
                            </div>
                        </div>)}

                    {isLoading && (
                        <div className="flex justify-center items-center mt-4">
                            <span className="loading loading-spinner loading-md"></span>&nbsp;
                            Loading your churches...
                        </div>)}

                    {!isLoading && churches.length === 0 && !error && (
                        <div role="alert" className="alert alert-info alert-outline mt-2">
                            <FontAwesomeIcon icon="far faLightbulb" />
                            <span className="text-base-content">
                                You do not currently administer any churches. Click
                                "Add New Church" below to create one and continue
                                registering for this event.
                            </span>
                        </div>)}

                    {!isLoading && churches.length > 0 && (
                        <ul className="menu bg-base-100 rounded-box w-full mt-2 p-0">
                            {churches.map(church => {
                                const isSelected = currentChurch?.Id === church.Id;
                                const locationLabel = formatChurchLocation(church);
                                return (
                                    <li key={`church-${church.Id}`}>
                                        <button
                                            type="button"
                                            className={`flex justify-between items-center ${isSelected ? "active" : ""}`}
                                            onClick={() => onClose(church)}>
                                            <div className="flex flex-col items-start">
                                                <span className="font-semibold">{church.Name}</span>
                                                {locationLabel && (
                                                    <span className="text-sm text-base-content/70 italic">
                                                        {locationLabel}
                                                    </span>)}
                                            </div>
                                            {isSelected && (
                                                <FontAwesomeIcon icon="fas faCheck" classNames={["text-success"]} />)}
                                        </button>
                                    </li>);
                            })}
                        </ul>)}

                    <div className="mt-4 flex flex-wrap gap-2 justify-end">
                        <button
                            type="button"
                            className="btn btn-primary mt-0"
                            onClick={() => setIsShowingAddDialog(true)}
                            disabled={isLoading}>
                            <FontAwesomeIcon icon="fas faPlus" />
                            Add New Church
                        </button>
                        <button
                            type="button"
                            className="btn btn-warning mt-0"
                            onClick={() => onClose(null)}>
                            Cancel
                        </button>
                    </div>
                </div>
            </dialog>
            {isShowingAddDialog && (
                <ChurchSettingsDialog
                    title="Add New Church"
                    authorizeChurch={true}
                    onSave={newChurch => {
                        setIsShowingAddDialog(false);
                        if (newChurch) {
                            // Add it to the list so it's visible above, and
                            // also close this dialog by selecting it.
                            setChurches(prev => [newChurch, ...prev]);
                            onClose(newChurch);
                        }
                    }}
                />)}
        </>);
}