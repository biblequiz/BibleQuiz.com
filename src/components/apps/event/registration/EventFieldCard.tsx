import type { ReactNode } from "react";

interface Props {
    title?: string;
    children: ReactNode;
    alignMiddle?: boolean;
    width?: string;
}

export default function EventFieldCard({
    title,
    children,
    alignMiddle = false,
    width = "lg:w-90" }: Props) {
    const bodyClass = alignMiddle ? "flex flex-col justify-center" : "";
    return (
        <div
            className={`card live-events-card w-full ${width} card-sm shadow-sm border-2 border-solid mt-0 relative`}
        >
            <div className={`card-body ${bodyClass}`}>
                {title && (
                    <h2 className="card-title mb-0 mt-1">
                        {title}
                    </h2>)}
                {children}
            </div>
        </div>);
}