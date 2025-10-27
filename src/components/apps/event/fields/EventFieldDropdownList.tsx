import type { JSX } from "react";
import { EventFieldControlType, type EventField } from "types/services/EventsService";

interface Props {
    field: EventField;
    value?: string;
    setValue(newValue: string): void;
    isExampleOnly: boolean;
    isDisabled?: boolean;
    controlNamePrefix?: string;
}

function getGradeListOptions(field: EventField): JSX.Element[] {

    const minGrade = Math.max(field.MinNumberValue ?? 0, 0);
    const maxGrade = Math.min(field.MaxNumberValue ?? 13, 13);

    const gradeOptions = Array.from({ length: maxGrade - minGrade + 1 }, (_, index) => {
        const i = minGrade + index;

        let label: string;
        switch (i) {
            case 0:
                label = "K";
                break;
            case 13:
                label = "A";
                break;
            default:
                label = i.toString();
                break;
        }

        return <option key={`grade_${i}`} value={i}>{label}</option>;
    });

    return [
        <option key="grade_blank" value="" disabled>Grade</option>,
        ...gradeOptions
    ];
}

export default function EventFieldDropdownList({
    field,
    value,
    setValue,
    isExampleOnly,
    isDisabled = false,
    controlNamePrefix = "" }: Props) {

    const control = (
        <select
            name={`${controlNamePrefix}${field.Label}`}
            className="select select-bordered w-full mt-0"
            value={value}
            onChange={e => setValue(e.target.value)}
            disabled={isDisabled}
            required={field.IsRequired && !isExampleOnly}
        >
            {field.ControlType === EventFieldControlType.GradeList
                ? getGradeListOptions(field)
                : field.Values!.map((value) => (
                    <option key={value} value={value}>{value}</option>))}
        </select>);

    if (field.Caption?.length ?? 0 > 0) {
        return (
            <div>
                {control}
                <div
                    className="mt-0 font-bold text-base-content text-xs"
                >
                    {field.Caption}
                </div>
            </div>);
    }

    return control;
}