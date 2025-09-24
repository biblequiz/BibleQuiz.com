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
            <p>
                This page includes the following fields:
            </p>
            <ul>
                <li>Registration Report & File</li>
                <li>ScoreKeep File (Excel and Text)</li>
            </ul>
        </>);
}