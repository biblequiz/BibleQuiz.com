import FontAwesomeIcon from "@components/FontAwesomeIcon";

interface SectionBadge {
    id: string;
    className: string;
    icon?: string;
    text: string;
}

interface Props {
    pageId: string;
    elementId?: string;
    icon?: string;
    iconChildren?: React.ReactNode;
    title: string;
    titleClass?: string;
    subtitle?: string;
    subtitleClass?: string;
    titleChildren?: React.ReactNode;
    isPrinting?: boolean;
    printSectionIndex?: number;
    forceOpen?: boolean;
    children?: React.ReactNode;
    badges?: SectionBadge[];
};

export default function CollapsibleSection({ pageId, elementId, icon, iconChildren, title, titleClass, subtitle, subtitleClass, titleChildren, isPrinting, printSectionIndex, forceOpen, children, badges }: Props) {

    const titleElement = (
        <>
            {printSectionIndex !== undefined && printSectionIndex > 0 && (
                <div style={{ breakBefore: "page" }} />
            )}
            <p className={`font-semibold mb-0 ${titleClass || "text-base"}`}>
                {icon && (<><FontAwesomeIcon icon={icon} />&nbsp;</>)}
                {iconChildren}
                {title}
                {!isPrinting && badges && badges.map((badge) => (
                    <span key={badge.id} className={`badge ${badge.className} badge-sm ml-2`} id={badge.id}>
                        {badge.icon && <FontAwesomeIcon icon={badge.icon} className="mr-1" />}
                        {badge.text}
                    </span>
                ))}
            </p>
            {subtitle && <div className={`${subtitleClass || "subtitle italic text-sm"} mt-0`}>{subtitle}</div>}
            {titleChildren}
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
                id={elementId}
                tabIndex={1}
                className={`collapse collapse-arrow bg-base-100 border-base-300 border no-anchor-links ${forceOpen ? "collapse-open" : ""}`}
            >
                <input type="checkbox" name={pageId} className="peer" />
                <div className={`collapse-title ${printSectionIndex === 0 ? "" : "pt-0"}`}>
                    {titleElement}
                </div>
                <div className="collapse-content text-sm overflow-x-auto mt-0">{children}</div>
            </div>);
    }
}