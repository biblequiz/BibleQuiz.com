interface Props {
    pageId: string;
    title: string;
    titleClass?: string;
    subtitle?: string;
    subtitleClass?: string;
    children?: React.ReactNode;
};

export default function CollapsibleSection({ pageId, title, titleClass, subtitle, subtitleClass, children }: Props) {
    return (
        <div
            tabIndex={1}
            className="collapse collapse-arrow bg-base-100 border-base-300 border no-anchor-links"
        >
            <input type="checkbox" id={pageId} className="peer" />
            <div className="collapse-title">
                <p className={`font-semibold ${titleClass || "text-base"}`}>{title}</p>
                {subtitle && <div className={`${subtitleClass || "subtitle italic text-sm"}`}>{subtitle}</div>}
            </div>
            <div className="collapse-content text-sm overflow-x-auto">{children}</div>
        </div >
    );
}