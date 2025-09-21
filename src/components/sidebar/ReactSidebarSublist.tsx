import FontAwesomeIcon from 'components/FontAwesomeIcon';
import { Icons } from "node_modules/@astrojs/starlight/components/Icons.ts";
import type { ReactSidebarEntry, ReactSidebarLink } from './ReactSidebar';
import "./sidebar-sublist.css";
import { type NavigateFunction } from 'react-router-dom';

interface Props {
    keyPrefix: string;
    navigate: NavigateFunction;
    entries?: ReactSidebarEntry[];
    nested?: boolean;
}

function flattenSidebar(sidebar: ReactSidebarEntry[]): ReactSidebarLink[] {
    return sidebar.flatMap((entry) =>
        entry.type === "group" ? flattenSidebar(entry.entries) : entry,
    );
}

export default function ReactSidebarSublist({ keyPrefix, navigate, entries = [], nested = false }: Props) {

    return (
        <ul className={nested ? "" : "top-level"}>
            {entries.map((entry, index) => (
                <li key={`${keyPrefix}${index}`}>
                    {entry.type === "link" && (
                        <div>
                            <a
                                onClick={e => {
                                    e.preventDefault();
                                    navigate(entry.attrs?.href || entry.href);
                                }}
                                aria-current={entry.isCurrent && "page"}
                                className={`cursor-pointer ${entry.attrs.className} ${nested ? "" : "large"}`}
                                {...entry.attrs}
                            >
                                {entry.attrs.icon && (
                                    <FontAwesomeIcon icon={entry.attrs.icon} classNames={["fa-fw"]} />
                                )}
                                <span>{entry.label}</span>
                            </a>
                        </div>
                    )}
                    {entry.type === "group" && (
                        <details
                            open={
                                flattenSidebar(entry.entries).some(
                                    (i) => i.isCurrent,
                                ) || !entry.collapsed
                            }
                        >
                            <summary>
                                <div className="group-label">
                                    <span className="large">{entry.label}</span>
                                </div>
                                <svg
                                    aria-hidden={true}
                                    className="caret"
                                    width="16"
                                    height="16"
                                    style={{ fontSize: "1.25rem" }}
                                    viewBox="0 0 24 24"
                                    fill="currentColor">
                                    {Icons["right-caret"]}
                                </svg>
                            </summary>
                            <ReactSidebarSublist
                                keyPrefix={`${keyPrefix}${index}-`}
                                navigate={navigate}
                                entries={entry.entries}
                                nested
                            />
                        </details>
                    )}
                </li>
            ))}
        </ul>);
}