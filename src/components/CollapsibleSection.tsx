import { useEffect, useState } from 'react';
import FontAwesomeIcon from './FontAwesomeIcon';

interface SectionBadge {
    id?: string;
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
    allowMultipleOpen?: boolean;
    defaultOpen?: boolean;
    persistState?: boolean;
    onClose?: () => void;
};

export default function CollapsibleSection({
    pageId,
    elementId,
    icon,
    iconChildren,
    title,
    titleClass,
    subtitle,
    subtitleClass,
    titleChildren,
    isPrinting,
    printSectionIndex,
    forceOpen,
    children,
    badges,
    allowMultipleOpen,
    defaultOpen,
    onClose,
    persistState = true }: Props) {

    const storageKey = `collapsible_${pageId}_${elementId || 'default'}`;

    const [isOpen, setIsOpen] = useState(() => {
        if (forceOpen) {
            return true;
        }

        if (!persistState || typeof window === 'undefined') {
            return defaultOpen ?? false;
        }

        const raw = sessionStorage.getItem(storageKey);
        if (raw === null || raw === undefined) {
            return defaultOpen ?? false;
        }

        try {
            const parsed = JSON.parse(raw);
            if (parsed === true || parsed === false) {
                return parsed;
            }
        }
        catch { }

        return defaultOpen ?? false;
    });

    useEffect(() => {
        if (forceOpen) {
            setIsOpenAndPersist(true);
        }
    }, [forceOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsOpenAndPersist(e.target.checked);
    };

    const setIsOpenAndPersist = (newState: boolean) => {
        setIsOpen(newState);
        if (persistState && typeof window !== 'undefined') {
            sessionStorage.setItem(storageKey, JSON.stringify(newState));
        }

        if (!newState && onClose) {
            onClose();
        }
    };

    const titleElement = (
        <>
            {printSectionIndex !== undefined && printSectionIndex > 0 && (
                <div style={{ breakBefore: "page" }} />
            )}
            <p className={`font-semibold mb-0 ${titleClass || "text-base"}`}>
                {icon && (<><FontAwesomeIcon icon={icon} />&nbsp;</>)}
                {iconChildren}
                {title}
                {!isPrinting && badges && badges.map((badge, index) => (
                    <span key={`${pageId}_${index}`} className={`badge ${badge.className} badge-sm ml-2`} id={badge.id}>
                        {badge.icon && <FontAwesomeIcon icon={badge.icon} classNames={["mr-1"]} />}
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
                className="collapse collapse-arrow bg-base-100 border-base-300 border no-anchor-links"
            >
                <input
                    type={(allowMultipleOpen ?? true) ? "checkbox" : "radio"}
                    name={pageId}
                    className="peer"
                    checked={forceOpen ?? isOpen}
                    onChange={handleChange}
                />
                <div className={`collapse-title ${printSectionIndex === 0 ? "" : "pt-0"}`}>
                    {titleElement}
                </div>
                <div className="collapse-content text-sm overflow-x-auto mt-0">{children}</div>
            </div>);
    }
}