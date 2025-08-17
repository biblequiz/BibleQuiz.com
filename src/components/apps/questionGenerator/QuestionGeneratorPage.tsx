import { useStore } from "@nanostores/react";
import { useEffect } from "react";
import { sharedAuthManager } from "../../../utils/SharedState";
import { getOptionalPermissionCheckAlert } from "../../auth/PermissionCheckAlert";
import CollapsibleSection from "../../CollapsibleSection";

interface Props {
    loadingElementId: string;
}

export default function QuestionGeneratorPage({ loadingElementId }: Props) {

    const authManager = useStore(sharedAuthManager);

    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) fallback.style.display = "none";
    }, [loadingElementId]);

    const permissionAlert = getOptionalPermissionCheckAlert(authManager, true);
    if (permissionAlert) {
        return permissionAlert;
    }

    return (
        <>
            <CollapsibleSection
                pageId="question-generator"
                title="Previously Generated Sets"
                titleClass="mt-4"
                allowMultipleOpen={false}
                defaultOpen={true}>
                    TODO: Add previously generated sets.
            </CollapsibleSection>
            <CollapsibleSection
                pageId="question-generator"
                title="Generate New Set"
                titleClass="mt-4"
                allowMultipleOpen={false}>
                    TODO: Add the form for the new sets.
            </CollapsibleSection>
        </>
    )
}