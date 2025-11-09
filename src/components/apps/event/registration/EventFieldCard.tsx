import type { ReactNode } from "react";

interface Props {
    children: ReactNode;
}

export default function EventFieldCard({ children }: Props) {
    return (
        <div
            className="card live-events-card w-full lg:w-90 card-sm shadow-sm border-2 border-solid mt-0 relative"
        >
            <div className="card-body">
                {children}
            </div>
        </div>);
}