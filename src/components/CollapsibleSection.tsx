import FontAwesomeIcon from "@components/FontAwesomeIcon";

interface Props {
    pageId: string;
    icon?: string;
    title: string;
    titleClass?: string;
    subtitle?: string;
    subtitleClass?: string;
    isPrinting?: boolean;
    printSectionIndex?: number;
    children?: React.ReactNode;
};

export default function CollapsibleSection({ pageId, icon, title, titleClass, subtitle, subtitleClass, isPrinting, printSectionIndex, children }: Props) {

    const titleElement = (
        <>
            {printSectionIndex !== undefined && printSectionIndex > 0 && (
                <div style={{ breakBefore: "page" }} />
            )}
            <p className={`font-semibold mb-0 ${titleClass || "text-base"}`}>
                {icon && (<><FontAwesomeIcon icon={icon} />&nbsp;</>)}
                {title}
            </p>
            {subtitle && <div className={`${subtitleClass || "subtitle italic text-sm"} mt-0`}>{subtitle}</div>}
        </>);

    if (isPrinting) {
        return (
            <div tabIndex={1} className="no-anchor-links">
                {titleElement}
                <div className="text-sm overflow-x-auto mt-0">{children}</div>
            </div>);
    }
    else {
        return (
            <div
                tabIndex={1}
                className="collapse collapse-arrow bg-base-100 border-base-300 border no-anchor-links"
            >
                <input type="checkbox" name={pageId} className="peer" />
                <div className={`collapse-title ${printSectionIndex === 0 ? "" : "pt-0"}`}>
                    {titleElement}
                </div>
                <div className="collapse-content text-sm overflow-x-auto mt-0">{children}</div>
            </div>);
    }
}