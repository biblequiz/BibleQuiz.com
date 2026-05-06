import { useStore } from "@nanostores/react";
import { sharedGlobalStatusToast, type GlobalToastMessage } from 'utils/SharedState';
import { useEffect } from "react";
import FontAwesomeIcon from './FontAwesomeIcon';

interface Props {
}

export default function GlobalStatusToast({ }: Props) {

    const toastState = useStore(sharedGlobalStatusToast);
    useEffect(() => {
        if (toastState && !toastState.keepOpen) {
            setTimeout(() => sharedGlobalStatusToast.set(null), toastState?.timeout || 30000);
        }
    }, [toastState]);

    if (!toastState) {
        return null;
    }

    const handleDismiss = () => {
        if (toastState.onDismiss) {
            toastState.onDismiss();
        }
        sharedGlobalStatusToast.set(null);
    };

    return (
        <div className="toast toast-top toast-center top-20">
            <div className={`alert alert-${toastState.type || "info"} flex flex-col relative`}>
                {toastState.keepOpen && (
                    <button
                        className="btn btn-ghost btn-xs absolute top-1 right-1"
                        onClick={handleDismiss}
                        aria-label="Dismiss"
                    >
                        <FontAwesomeIcon icon="fas faXmark" />
                    </button>
                )}
                <b>{toastState.title.toUpperCase()}</b>
                <p className="text-sm">
                    {toastState.icon && <><FontAwesomeIcon icon={toastState.icon} classNames={["mr-2"]} />&nbsp;</>}
                    {toastState.showLoading && <><span className="loading loading-spinner loading-md"></span>&nbsp;</>}
                    {toastState.message}
                </p>
            </div>
        </div>);
}
