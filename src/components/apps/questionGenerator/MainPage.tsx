import PreviousSetsSection from './PreviousSetsSection';
import GenerateSetSection from './GenerateSetSection';
import { useRef } from "react";

interface Props {
}

export default function MainPage({ }: Props) {
    const generateSetElement = useRef<HTMLDivElement>(null);

    return (
        <>
            <PreviousSetsSection generateSetElement={generateSetElement} />
            <div className="divider" />
            <GenerateSetSection generateSetElement={generateSetElement} />
        </>
    );
}