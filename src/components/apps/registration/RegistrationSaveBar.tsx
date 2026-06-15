import FontAwesomeIcon from "components/FontAwesomeIcon";

interface Props {
    isDirty: boolean;
    isSaving: boolean;
    onSave: () => void;
}

export default function RegistrationSaveBar({ isDirty, isSaving, onSave }: Props) {

    if (!isDirty && !isSaving) {
        return null;
    }

    return (
        <div className="fixed bottom-0 right-0 left-0 md:left-[var(--sl-sidebar-width,18rem)] z-50 bg-base-200 border-t border-base-300 shadow-lg">
            <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-2">
                <span className="text-sm text-base-content/70">
                    <FontAwesomeIcon icon="fas faCircle" classNames={["text-warning", "mr-2"]} />
                    Unsaved changes
                </span>
                <button
                    type="button"
                    className="btn btn-primary btn-sm m-0"
                    disabled={isSaving}
                    onClick={onSave}
                >
                    {isSaving
                        ? (<><span className="loading loading-spinner loading-xs"></span> Saving...</>)
                        : (<><FontAwesomeIcon icon="fas faFloppyDisk" classNames={["mr-1"]} /> Save</>)}
                </button>
            </div>
        </div>
    );
}
