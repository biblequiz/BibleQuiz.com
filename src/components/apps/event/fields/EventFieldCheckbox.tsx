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
        name={`${controlNamePrefix}${field.Label}`}
        disabled={isDisabled}
        checked={value === "1"}
        required={field.IsRequired && !isExampleOnly}
        onChange={e => setValue(e.target.checked ? "1" : "0")}
    />);

    const isHtmlCaption = EventFieldControlType.HtmlCheckbox == field.ControlType;
    let captionHtml = field.Caption?.trim();
    if (isHtmlCaption &&
        captionHtml?.length > 0 &&
        '<' !== captionHtml.charAt(0)) {
        captionHtml = `<p>${captionHtml}</p>`;
    }

    return (
        <div className="w-full mt-0">
            <label className="label text-wrap">
                {checkbox}
                {isHtmlCaption && (
                    <span>
                        {field.Label.toUpperCase()}
                    </span>)}
                {isHtmlCaption && captionHtml && (<div dangerouslySetInnerHTML={{ __html: captionHtml }} />)}
                {!isHtmlCaption && (
                    <h6>
                        <small>
                            {captionHtml}
                            {field.MaxCount != null && ` (Max ${field.MaxCount})`}
                        </small>
                    </h6>)}
            </label>
        </div>);
}