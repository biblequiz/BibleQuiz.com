interface Props {
    id?: string;
    text: string;
    className?: string;
    spinnerSize?: "sm" | "md" | "lg" | "xl";
    textSize?: "sm" | "md" | "lg" | "xl";
    isItalic?: boolean;
}

export default function LoadingPlaceholder({ id, text, className, spinnerSize, textSize, isItalic }: Props) {

    const textClass = textSize
        ? `text-${textSize} ${isItalic ? "italic" : ""}`
        : (isItalic ? "italic" : "");

    return (
        <div id={id} className={`flex justify-center items-center ${className ?? ""}`}>
            <span className={`loading loading-spinner loading-${spinnerSize ?? "lg"}`}></span>&nbsp;
            <span className={textClass}>{text}</span>
        </div>);
}