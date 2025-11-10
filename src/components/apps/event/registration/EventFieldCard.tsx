import type { ReactNode } from "react";

interface Props {
    children: ReactNode;
    alignMiddle?: boolean;
}

export default function EventFieldCard({ children, alignMiddle = false }: Props) {
    const bodyClass = alignMiddle ? "flex flex-col justify-center" : "";
    return (
        <div
            className="card live-events-card w-full lg:w-90 card-sm shadow-sm border-2 border-solid mt-0 relative"
        >
            <div className={`card-body ${bodyClass}`}>
                {children}
            </div>
        </div>);
}