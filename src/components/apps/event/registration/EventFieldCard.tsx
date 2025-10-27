import type { EventField } from "types/services/EventsService";
import EventFieldControl from "../fields/EventFieldControl";

interface Props {
    field: EventField;
}

export default function EventFieldCard({ field }: Props) {
    console.log(field.ControlType);
    return (
        <div
            className="card live-events-card w-96 card-sm shadow-sm border-2 border-solid mt-0 relative"
        >
            <div className="card-body">
                <div className="flex items-start gap-4">
                    <div className="flex-1 pr-4">
                        <div className="card-title mb-0">
                            <EventFieldControl field={field} isExampleOnly={true} />
                        </div>
                        <p className="mt-0">Text</p>
                        <span className="badge badge-neutral">Registration Available</span>
                    </div>
                </div>
            </div>
        </div>);
}