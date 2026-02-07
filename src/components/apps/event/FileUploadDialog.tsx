import { useRef } from "react";
import type { EventInfo } from "types/EventTypes";

interface Props {
    title: string;
    extensions: string[];
    onSelect: (formData: FormData | null) => void;
}

export interface EventInfoCache {
    events: EventInfoWithTypeId[] | undefined;
    season: number | undefined;
}

export interface EventInfoWithTypeId extends EventInfo {
    typeId: string;
}

export default function FileUploadDialog({
    title,
    extensions,
    onSelect }: Props) {

    const dialogRef = useRef<HTMLDialogElement>(null);

    return (
        <dialog ref={dialogRef} className="modal" open>
            <div className="modal-box w-full max-w-3xl">
                <h3 className="font-bold text-lg">Select an Event</h3>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={() => {
                        onSelect(null);
                        dialogRef.current?.close();
                    }}
                >✕</button>
                <div className="mt-4">
                    TODO: Add the implementation
                </div>
                <div className="mt-4 text-right">
                    <button
                        className="btn btn-warning mt-0"
                        type="button"
                        disabled={isLoading || isAssigning}
                        tabIndex={2}
                        onClick={() => {
                            setIsAssigning(true);
                            onSelect(null);
                            dialogRef.current?.close();
                        }}>
                        Close
                    </button>
                </div>
            </div>
        </dialog>);
}