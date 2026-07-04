import { reactSidebarEntries } from "components/sidebar/ReactSidebar";
import FontAwesomeIcon from "../FontAwesomeIcon";
import { useStore } from "@nanostores/react";
import { useEffect } from "react";

interface Props {
    title?: string;
    message?: string;
}

export default function InsufficientPermissionsSection({
    title = "Insufficient Permissions",
    message = "Unfortunately, you don't have the necessary permissions to access this feature or item. If your permissions were recently changed, try logging out and logging back in."
}: Props) {

    const sidebar = useStore(reactSidebarEntries);
    useEffect(() => {
        if (sidebar.showParent) {
            reactSidebarEntries.set({ ...sidebar, showParent: false });
        }
    }, [sidebar]);

    return (
        <div className="hero bg-base-300 rounded-2xl shadow-lg">
            <div className="hero-content text-center py-16 px-8">
                <div className="max-w-4xl">
                    <h1 className="text-3xl font-bold text-base-content mb-4">
                        <FontAwesomeIcon icon="fas faTriangleExclamation" />
                        <span className="ml-4">{title}</span>
                    </h1>
                    <p className="text-lg text-base-content/70 mb-8">
                        {message}
                    </p>
                </div>
            </div>
        </div>);
}