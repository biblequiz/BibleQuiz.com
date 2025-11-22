import { EventFieldControlType, type EventField } from "types/services/EventsService";

interface Props {
    field: EventField;
    value?: string;
    setValue(newValue: string): void;
    isExampleOnly: boolean;
    isDisabled?: boolean;
    controlNamePrefix?: string;
}

export default function EventFieldCheckbox({
    field,
    value,
    setValue,
    isExampleOnly,
    isDisabled = false,
    controlNamePrefix = "" }: Props) {

    const checkbox = (<input
        type="checkbox"
        className="checkbox checkbox-sm checkbox-info"
        name={`${controlNamePrefix}${field.Label}`}
        disabled={isDisabled}
        checked={value === "1"}
        required={field.IsRequired && !isExampleOnly}
        onChange={e => setValue(e.target.checked ? "1" : "0")}
    />);

    const isHtmlCaption = EventFieldControlType.HtmlCheckbox == field.ControlType;
    let captionHtml = field.Caption?.trim() ?? "";
    if (isHtmlCaption &&
        captionHtml?.length > 0 &&
        '<' !== captionHtml.charAt(0)) {
        captionHtml = `<p>${captionHtml}</p>`;
    }

    return (
        <div className="w-full mt-0">
            <label className="label text-wrap">
                {checkbox}
                <span className="text-base-content">
                    {isHtmlCaption ? field.Label.toUpperCase() : field.Label}
                </span>
            </label>
            {isHtmlCaption && captionHtml && (
                <div
                    className="mt-0 font-bold text-base-content text-xs"
                    dangerouslySetInnerHTML={{ __html: captionHtml }} />)}
            {!isHtmlCaption && (
                <div
                    className="mt-0 font-bold text-base-content text-xs"
                >
                    {captionHtml}
                </div>)}
        </div>);
}