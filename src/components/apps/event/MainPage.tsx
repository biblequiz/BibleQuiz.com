import { AuthManager } from "types/AuthManager";

interface Props {
}

export default function MainPage({ }: Props) {
    const auth = AuthManager.useNanoStore();

    return (
        <>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}