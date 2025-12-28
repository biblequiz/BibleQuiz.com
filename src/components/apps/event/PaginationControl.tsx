import { useState, useEffect, useRef } from 'react';

interface Props {
    currentPage: number;
    pages: number;
    setPage: (page: number) => void;
    isLoading: boolean;
}

export default function PaginationControl({
    currentPage,
    pages,
    setPage,
    isLoading }: Props) {

    const containerRef = useRef<HTMLDivElement>(null);
    const [maxButtons, setMaxButtons] = useState(18);

    useEffect(() => {
        const updateMaxButtons = () => {
            if (!containerRef.current) return;
            
            const containerWidth = containerRef.current.offsetWidth;
            const buttonWidth = 48; // btn-square default width in pixels
            const gap = 0; // join removes gaps
            
            const availableButtons = Math.floor(containerWidth / (buttonWidth + gap));
            setMaxButtons(Math.max(5, Math.min(18, availableButtons))); // Min 5, max 18
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
            return Array.from({ length: pages }, (_, i) => i + 1);
        }

        const result: (number | null)[] = [];
        const current = currentPage + 1;
        
        result.push(1);
        
        const sideButtons = Math.floor((maxButtons - 3) / 2);
        let start = Math.max(2, current - sideButtons);
        let end = Math.min(pages - 1, current + sideButtons);
        
        if (current <= sideButtons + 2) {
            end = Math.min(pages - 1, maxButtons - 2);
            start = 2;
        }
        
        if (current >= pages - sideButtons - 1) {
            start = Math.max(2, pages - maxButtons + 2);
            end = pages - 1;
        }
        
        if (start > 2) {
            result.push(null);
        }
        
        for (let i = start; i <= end; i++) {
            result.push(i);
        }
        
        if (end < pages - 1) {
            result.push(null);
        }
        
        result.push(pages);
        
        return result;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div ref={containerRef} className="join">
            {pageNumbers.map((page, index) => 
                page === null ? (
                    <button
                        key={`ellipsis_${index}`}
                        className="join-item btn btn-square btn-disabled"
                        disabled>
                        ...
                    </button>
                ) : (
                    <input
                        key={`page_${page}`}
                        className="join-item btn btn-square"
                        type="radio"
                        name="options"
                        aria-label={page.toString()}
                        value={page}
                        checked={currentPage === page - 1}
                        disabled={isLoading}
                        onChange={e => setPage(Number(e.target.value) - 1)} />
                )
            )}
        </div>
    );
}