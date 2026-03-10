import { useState, useMemo, useCallback } from "react";
import type { RuleSet, RuleSection, RuleItem } from "../../types/rules";

// --- Utility types and functions ---

interface FlatItem {
  item: RuleItem;
  sectionTitle: string;
  sectionPath: string[];
  numbering: string;
}

function toLetterLabel(index: number): string {
  return String.fromCharCode(97 + index); // a, b, c, ...
}

function flattenItems(sections: RuleSection[], path: string[] = []): FlatItem[] {
  const result: FlatItem[] = [];
  for (const section of sections) {
    const currentPath = [...path, section.title];
    for (let i = 0; i < section.items.length; i++) {
      const item = section.items[i];
      const itemNum = `(${i + 1})`;
      result.push({ item, sectionTitle: section.title, sectionPath: currentPath, numbering: itemNum });
      if (item.subItems) {
        for (let j = 0; j < item.subItems.length; j++) {
          const sub = item.subItems[j];
          const subNum = `${itemNum}(${toLetterLabel(j)})`;
          result.push({ item: sub, sectionTitle: section.title, sectionPath: currentPath, numbering: subNum });
        }
      }
    }
    if (section.subsections) {
      result.push(...flattenItems(section.subsections, currentPath));
    }
  }
  return result;
}

function collectAllTags(sections: RuleSection[]): string[] {
  const tags = new Set<string>();
  function walk(secs: RuleSection[]) {
    for (const s of secs) {
      s.tags.forEach(t => tags.add(t));
      s.items.forEach(i => {
        i.tags.forEach(t => tags.add(t));
        i.subItems?.forEach(si => si.tags.forEach(t => tags.add(t)));
      });
      if (s.subsections) walk(s.subsections);
    }
  }
  walk(sections);
  return Array.from(tags).sort();
}

/** Renders markdown-style bold (**text**) and italic (*text*) as JSX elements. */
function renderMarkdown(text: string): React.ReactNode[] {
  // Process **bold** and *italic* patterns
  const parts: React.ReactNode[] = [];
  // Regex: match **bold** first, then *italic*
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      // **bold**
      parts.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3]) {
      // *italic*
      parts.push(<em key={key++}>{match[3]}</em>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return renderMarkdown(text);
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={`h${i}`} className="bg-yellow-300 text-black rounded px-0.5">{part}</mark>
    ) : (
      <span key={`t${i}`}>{renderMarkdown(part)}</span>
    )
  );
}

function itemMatchesSearch(item: RuleItem, query: string, tag: string): boolean {
  const q = query.toLowerCase().trim();
  const textMatch = !q || item.text.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
  const tagMatch = !tag || item.tags.includes(tag);
  return textMatch && tagMatch;
}

function getMatchingIds(sections: RuleSection[], query: string, tag: string): Set<string> {
  const ids = new Set<string>();
  function walk(secs: RuleSection[]) {
    for (const s of secs) {
      for (const item of s.items) {
        if (itemMatchesSearch(item, query, tag)) ids.add(item.id);
        if (item.subItems) {
          for (const sub of item.subItems) {
            if (itemMatchesSearch(sub, query, tag)) ids.add(sub.id);
          }
        }
      }
      if (s.subsections) walk(s.subsections);
    }
  }
  walk(sections);
  return ids;
}

// --- Section Tree Rendering ---

function SectionTree({ sections, searchQuery, selectedTag, selectedIds, onToggle, matchingIds, depth = 0 }: {
  sections: RuleSection[];
  searchQuery: string;
  selectedTag: string;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  matchingIds: Set<string>;
  depth?: number;
}) {
  return (
    <>
      {sections.map(section => (
        <SectionNode key={section.id} section={section} searchQuery={searchQuery}
          selectedTag={selectedTag} selectedIds={selectedIds} onToggle={onToggle}
          matchingIds={matchingIds} depth={depth} />
      ))}
    </>
  );
}

function sectionHasMatch(section: RuleSection, matchingIds: Set<string>): boolean {
  for (const item of section.items) {
    if (matchingIds.has(item.id)) return true;
    if (item.subItems?.some(si => matchingIds.has(si.id))) return true;
  }
  return section.subsections?.some(s => sectionHasMatch(s, matchingIds)) ?? false;
}

function SectionNode({ section, searchQuery, selectedTag, selectedIds, onToggle, matchingIds, depth }: {
  section: RuleSection;
  searchQuery: string;
  selectedTag: string;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  matchingIds: Set<string>;
  depth: number;
}) {
  const hasMatch = useMemo(() => sectionHasMatch(section, matchingIds), [section, matchingIds]);
  const isFiltering = searchQuery.trim() !== "" || selectedTag !== "";
  if (isFiltering && !hasMatch) return null;

  const headingClasses = depth === 0
    ? "text-lg font-bold mt-6 mb-2 text-accent"
    : depth === 1
      ? "text-base font-semibold mt-4 mb-1.5"
      : "text-sm font-semibold mt-3 mb-1";

  const Tag = depth === 0 ? "h3" : depth === 1 ? "h4" : "h5";

  return (
    <div className={depth > 0 ? "ml-2 border-l-2 border-base-300 pl-3" : ""}>
      <Tag className={headingClasses}>{section.title}</Tag>
      <div className="space-y-1">
        {section.items.map(item => {
          if (isFiltering && !matchingIds.has(item.id) && !item.subItems?.some(si => matchingIds.has(si.id))) return null;
          return (
            <ItemRow key={item.id} item={item} searchQuery={searchQuery}
              selectedIds={selectedIds} onToggle={onToggle} matchingIds={matchingIds} isFiltering={isFiltering} />
          );
        })}
      </div>
      {section.subsections && (
        <SectionTree sections={section.subsections} searchQuery={searchQuery}
          selectedTag={selectedTag} selectedIds={selectedIds} onToggle={onToggle}
          matchingIds={matchingIds} depth={depth + 1} />
      )}
    </div>
  );
}

function ItemRow({ item, searchQuery, selectedIds, onToggle, matchingIds, isFiltering }: {
  item: RuleItem;
  searchQuery: string;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  matchingIds: Set<string>;
  isFiltering: boolean;
}) {
  const isSelected = selectedIds.has(item.id);
  return (
    <div>
      <div
        className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-colors hover:bg-base-200 ${isSelected ? "bg-accent/15 ring-1 ring-accent" : ""}`}
        onClick={() => onToggle(item.id)}
        role="button" tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(item.id); } }}
      >
        <input type="checkbox" className="checkbox checkbox-accent checkbox-sm mt-0.5 flex-shrink-0"
          checked={isSelected} onChange={() => onToggle(item.id)} onClick={e => e.stopPropagation()} tabIndex={-1} />
        <div className="flex-1 min-w-0">
          <span className="text-sm leading-relaxed">
            {highlightText(item.text, searchQuery)}
          </span>
        </div>
        <span className="badge badge-ghost badge-sm flex-shrink-0 mt-0.5">p.{item.pdfPage}</span>
      </div>
      {item.subItems && (
        <div className="ml-8 space-y-0.5">
          {item.subItems.map(sub => {
            if (isFiltering && !matchingIds.has(sub.id)) return null;
            const subSel = selectedIds.has(sub.id);
            return (
              <div key={sub.id}
                className={`flex items-start gap-2 p-1.5 pl-2 rounded cursor-pointer transition-colors hover:bg-base-200 ${subSel ? "bg-accent/15 ring-1 ring-accent" : ""}`}
                onClick={() => onToggle(sub.id)}
                role="button" tabIndex={0}
                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(sub.id); } }}
              >
                <input type="checkbox" className="checkbox checkbox-accent checkbox-xs mt-0.5 flex-shrink-0"
                  checked={subSel} onChange={() => onToggle(sub.id)} onClick={e => e.stopPropagation()} tabIndex={-1} />
                <div className="flex-1 min-w-0">
                  <span className="text-xs leading-relaxed">
                    {highlightText(sub.text, searchQuery)}
                  </span>
                </div>
                <span className="badge badge-ghost badge-xs flex-shrink-0">p.{sub.pdfPage}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Selected Items Panel ---

function SelectedPanel({ selectedIds, flatItems, pdfPath, onRemove, onReset }: {
  selectedIds: Set<string>;
  flatItems: FlatItem[];
  pdfPath: string;
  onRemove: (id: string) => void;
  onReset: () => void;
}) {
  const selected = useMemo(() => {
    const idMap = new Map<string, FlatItem>();
    flatItems.forEach(fl => idMap.set(fl.item.id, fl));
    return Array.from(selectedIds).map(id => idMap.get(id)).filter(Boolean) as FlatItem[];
  }, [selectedIds, flatItems]);

  if (selected.length === 0) return null;

  return (
    <div className="bg-base-200 rounded-lg p-4 mb-4 border border-base-300">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Selected Rules ({selected.length})
        </h3>
        <button className="btn btn-error btn-sm" onClick={onReset}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Reset All
        </button>
      </div>
      <div className="space-y-2">
        {selected.map(fl => {
          const isSubItem = fl.numbering.includes(")(");
          return (
            <div key={fl.item.id} className={`flex items-start gap-2 bg-base-100 rounded p-2${isSubItem ? " ml-6 border-l-2 border-accent/30" : ""}`}>
              <button className="btn btn-ghost btn-xs text-error mt-0.5 flex-shrink-0" onClick={() => onRemove(fl.item.id)} title="Remove">✕</button>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-base-content/60 mb-0.5">
                  {fl.sectionPath.join(" > ")}
                </div>
                <div className="font-semibold text-sm text-accent mb-0.5">
                  {fl.sectionTitle} {fl.numbering}
                </div>
                <span className="text-sm">{renderMarkdown(fl.item.text)}</span>
              </div>
              <a href={`${pdfPath}#page=${fl.item.pdfPage}`} target="_blank" rel="noopener noreferrer"
                className="badge badge-accent badge-sm flex-shrink-0 mt-0 cursor-pointer hover:badge-primary"
                title={`Open PDF page ${fl.item.pdfPage}`}
              >
                📄 p.{fl.item.pdfPage}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Main Component ---

interface Props {
  ruleSet: RuleSet;
}

export default function RulesBrowser({ ruleSet }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allTags = useMemo(() => collectAllTags(ruleSet.sections), [ruleSet]);
  const flatItems = useMemo(() => flattenItems(ruleSet.sections), [ruleSet]);
  const matchingIds = useMemo(() => getMatchingIds(ruleSet.sections, searchQuery, selectedTag), [ruleSet, searchQuery, selectedTag]);

  const toggleItem = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => setSelectedIds(new Set()), []);

  const isFiltering = searchQuery.trim() !== "" || selectedTag !== "";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Selected Items Panel */}
      <SelectedPanel selectedIds={selectedIds} flatItems={flatItems}
        pdfPath={ruleSet.pdfPath} onRemove={toggleItem} onReset={resetAll} />

      {/* Search and Filter Bar */}
      <div className="sticky top-14 z-10 bg-base-100 pb-3 pt-1 border-b border-base-300 mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <label className="input input-bordered input-sm flex items-center gap-2 w-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" className="grow" placeholder="Search rules..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              {searchQuery && (
                <button className="btn btn-ghost btn-xs" onClick={() => setSearchQuery("")}>✕</button>
              )}
            </label>
          </div>
          <select className="select select-bordered select-sm w-full sm:w-48 mt-0"
            value={selectedTag} onChange={e => setSelectedTag(e.target.value)}>
            <option value="">All Tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          <a href={ruleSet.pdfPath} target="_blank" rel="noopener noreferrer"
            className="btn btn-outline btn-sm mt-0 gap-1">
            📄 PDF
          </a>
        </div>
        {isFiltering && (
          <div className="text-xs text-base-content/60 mt-1.5">
            Showing {matchingIds.size} matching rule{matchingIds.size !== 1 ? "s" : ""}
            {selectedTag && <span className="badge badge-sm badge-accent ml-1">{selectedTag}</span>}
          </div>
        )}
      </div>

      {/* Rules Tree */}
      <SectionTree sections={ruleSet.sections} searchQuery={searchQuery}
        selectedTag={selectedTag} selectedIds={selectedIds} onToggle={toggleItem}
        matchingIds={matchingIds} />

      {/* Empty state */}
      {isFiltering && matchingIds.size === 0 && (
        <div className="text-center py-12 text-base-content/50">
          <p className="text-lg mb-2">No rules match your search.</p>
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearchQuery(""); setSelectedTag(""); }}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}