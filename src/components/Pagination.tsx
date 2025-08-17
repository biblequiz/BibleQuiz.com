interface Props {
    currentPage: number;
    pageCount: number;
    pageSize: number;
    setPageSettings: (pageNumber: number, pageSize: number) => void;
}

export default function Pagination({ currentPage, pageCount, pageSize, setPageSettings }: Props) {

    if (currentPage <= 1 && pageCount <= 1) {
        return null; // No pagination needed
    }

    return (
        <div className="my-2">
            <div className="flex items-center gap-2">
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setPageSettings(currentPage - 1, pageSize)}
                    disabled={currentPage <= 1}
                >
                    {"<"}
                </button>
                <span className="flex items-center whitespace-nowrap gap-1">
                    <select
                        value={currentPage}
                        onChange={(e) => setPageSettings(Number(e.target.value), pageSize)}
                        className="select select-sm select-bordered"
                    >
                        {Array.from({ length: pageCount }, (_, i) => (
                            <option key={`pagination_page_${i + 1}`} value={i + 1}>
                                {i + 1}
                            </option>
                        ))}
                    </select>
                    &nbsp;of {pageCount}
                </span>
                <button
                    className="btn btn-primary btn-sm mt-0"
                    onClick={() => setPageSettings(currentPage + 1, pageSize)}
                    disabled={currentPage >= pageCount}
                >
                    {">"}
                </button>
                <span className="flex items-center whitespace-nowrap gap-1">
                    <select
                        value={pageSize}
                        onChange={(e) => setPageSettings(1, Number(e.target.value))}
                        className="select select-sm select-bordered"
                    >
                        {[10, 20, 30, 40, 50].map((s) => (
                            <option key={`pagination_size_${s}`} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                    per Page
                </span>
            </div>
        </div>
    );
}