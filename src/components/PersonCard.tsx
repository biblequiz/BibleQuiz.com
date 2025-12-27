import type { Person } from "types/services/PeopleService";

interface Props {
    person: Person;
    onSelect: (person: Person) => void;
    isDisabled?: boolean;
}

export default function PersonCard({
    person,
    onSelect,
    isDisabled = false }: Props) {

    return (
        <button
            type="button"
            className={`card live-events-card w-full lg:w-57 card-sm shadow-sm border-2 border-solid mt-0 relative cursor-pointer ${isDisabled ? "bg-base-500 cursor-not-allowed opacity-50" : ""}`}
            onClick={() => onSelect(person)}
            disabled={isDisabled}
        >
            <div className="card-body flex flex-col text-left">
                <h2 className="card-title mb-0 mt-0">
                    {person.FirstName} {person.LastName}
                </h2>
                <div className="w-full mt-0">
                    {person.CurrentChurch?.Name}
                </div>
            </div>
        </button>);
}