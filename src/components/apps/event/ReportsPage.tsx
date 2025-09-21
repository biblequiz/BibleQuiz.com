import { AuthManager } from "types/AuthManager";

interface Props {
}

export default function ReportsPage({ }: Props) {
    const auth = AuthManager.useNanoStore();

    return (
        <>
            <div>
                <b>Downloads & Reports Page</b>
            </div>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}