interface Props {
}

export default function DebugEventPage({ }: Props) {

    return (
        <>
            <div>
                <b>Help & Debug Page</b>
            </div>
            <p>
                This page will provide the means to debug various event issues:
            </p>
            <ul>
                <li>Why is my event not showing up in the event list?</li>
                <li>Why is my data not being uploaded?</li>
            </ul>
        </>);
}