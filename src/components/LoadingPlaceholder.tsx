interface Props {
    id?: string;
    text: string;
    spinnerSize?: "sm" | "md" | "lg" | "xl";
    textSize?: "sm" | "md" | "lg" | "xl";
}

export default function LoadingPlaceholder({ id, text, spinnerSize, textSize }: Props) {

    const textClass = textSize
        ? `text-${textSize}`
        : "";

    return (
        <div id={id} className="flex justify-center items-center">
            <span className={`loading loading-spinner loading-${spinnerSize ?? "lg"}`}></span>&nbsp;
            <span className={textClass}>{text}</span>
        </div>);
}