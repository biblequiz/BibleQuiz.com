import { useEffect, useRef, useState } from 'react';
import FontAwesomeIcon from 'components/FontAwesomeIcon';

interface Props {
    currentPage: number;
    pages: number;
    setPage: (page: number) => void;
    isLoading: boolean;
}

export default function Pagination({
    currentPage,
    pages,
    setPage,
    isLoading
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [maxButtons, setMaxButtons] = useState(10);

    useEffect(() => {
        const updateMaxButtons = () => {
            if (!containerRef.current) return;

            const containerWidth = containerRef.current.offsetWidth;
            const buttonWidth = 36;
            const availableButtons = Math.floor(containerWidth / (buttonWidth + 4));
            setMaxButtons(Math.max(3, Math.min(15, availableButtons)));
        };

        updateMaxButtons();
        window.addEventListener('resize', updateMaxButtons);
        return () => window.removeEventListener('resize', updateMaxButtons);
    }, []);

    if (pages <= 1) {
        return null;
    }

    const getPageNumbers = (): (number | null)[] => {
        if (pages <= maxButtons) {
            return Array.from({ length: pages }, (_, index) => index + 1);
        }

        const result: (number | null)[] = [];
        const current = currentPage + 1;

        result.push(1);

        if (current > maxButtons / 2 + 1) {
            result.push(null);
        }

        const start = Math.max(2, current - Math.floor(maxButtons / 3));
        const end = Math.min(pages - 1, current + Math.floor(maxButtons / 3));

        for (let pageNumber = start; pageNumber <= end; pageNumber++) {
            result.push(pageNumber);
        }

        if (current < pages - maxButtons / 2) {
            result.push(null);
        }

        result.push(pages);

        return result;
    };

    return (
        <div ref={containerRef} className="flex justify-center mt-4">
            <div className="join">
                <button
                    className="join-item btn btn-sm"
                    onClick={() => setPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0 || isLoading}
                >
                    <FontAwesomeIcon icon="fas faChevronLeft" />
                </button>

                {getPageNumbers().map((pageNumber, index) =>
                    pageNumber === null ? (
                        <button
                            key={`ellipsis-${index}`}
                            className="join-item btn btn-sm btn-disabled"
                            disabled
                        >
                            ...
                        </button>
                    ) : (
                        <button
                            key={pageNumber}
                            className={`join-item btn btn-sm ${pageNumber - 1 === currentPage ? 'btn-active' : ''}`}
                            onClick={() => setPage(pageNumber - 1)}
                            disabled={isLoading}
                        >
                            {pageNumber}
                        </button>
                    )
                )}

                <button
                    className="join-item btn btn-sm"
                    onClick={() => setPage(Math.min(pages - 1, currentPage + 1))}
                    disabled={currentPage === pages - 1 || isLoading}
                >
                    <FontAwesomeIcon icon="fas faChevronRight" />
                </button>
            </div>
        </div>
    );
}