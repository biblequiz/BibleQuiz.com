import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { EventField } from "types/services/EventsService";
import EventFieldControl from "../fields/EventFieldControl";

interface Props {
    field: EventField;
}

export default function EventFieldCard({ field }: Props) {

    return (
        <div
            className="card live-events-card w-96 card-sm shadow-sm border-2 border-solid mt-0 relative"
        >
            <div className="card-body">
                {field && (
                    <div className="flex items-start gap-4">
                        <div className="flex-1 pr-4">
                            <h2 className="card-title mb-0">
                                <EventFieldControl field={field} isExampleOnly={true} />
                            </h2>
                            <p className="mt-0">Text</p>
                            <span className="badge badge-neutral">Registration Available</span>
                        </div>
                    </div>)}
                <FontAwesomeIcon
                    icon="fas faArrowRight"
                    classNames={["icon text-lg rtl:flip absolute top-4 right-4"]}
                />
            </div>
        </div>);
}