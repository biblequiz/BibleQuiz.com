import { useStore } from "@nanostores/react";
import { sharedGlobalStatusToast } from "../utils/SharedState";
import { useEffect } from "react";
import FontAwesomeIcon from "./FontAwesomeIcon";

interface Props {
}

export default function GlobalErrorToast({ }: Props) {

    const toastState = useStore(sharedGlobalStatusToast);
    useEffect(() => {
        if (toastState && !toastState.keepOpen) {
            setTimeout(() => sharedGlobalStatusToast.set(null), toastState?.timeout || 5000);
        }
    }, [toastState]);

    if (!toastState) {
        return null;
    }

    return (
        <div className="toast toast-top toast-center top-20">
            <div className={`alert alert-${toastState.type || "info"} flex flex-col`}>
                <b>{toastState.title.toUpperCase()}</b>
                <p className="text-sm">
                    {toastState.icon && <><FontAwesomeIcon icon={toastState.icon} classNames={["mr-2"]} />&nbsp;</>}
                    {toastState.showLoading && <><span className="loading loading-spinner loading-md"></span>&nbsp;</>}
                    {toastState.message}
                </p>
            </div>
        </div>);
}