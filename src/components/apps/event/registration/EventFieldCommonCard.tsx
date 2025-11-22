import FontAwesomeIcon from "components/FontAwesomeIcon";

interface Props {
    title: string;
    description: string;
    restriction: string;
    addField: () => void;
}

export default function EventFieldCommonCard({ title, description, restriction, addField }: Props) {

    return (
        <button
            className="card live-events-card w-55 card-sm shadow-sm border-2 border-solid mt-0 relative cursor-pointer"
            onClick={() => addField()}
        >
            <div className="card-body p-2 pl-4">
                <div className="flex items-start gap-4">
                    <div className="flex-1 mt-2 pr-6 text-left">
                        <h2 className="card-title mb-0 mt-1">
                            {title}
                        </h2>
                        <p className="mt-0">
                            {description}<br />
                            <em>{restriction}</em>
                        </p>
                    </div>
                </div>
                <FontAwesomeIcon
                    icon="fas faPlus"
                    classNames={["icon text-lg rtl:flip absolute top-4 right-4"]}
                />
            </div>
        </button>);
}