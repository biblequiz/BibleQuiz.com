import { useEffect, useState } from "react";

export interface BracketConnection {
    /** Source room index */
    sourceRoomIndex: number;
    /** Source match index */
    sourceMatchIndex: number;
    /** Destination room index */
    destRoomIndex: number;
    /** Destination match index */
    destMatchIndex: number;
    /** Rank that advances (for labeling) */
    rank: number;
}

export interface BracketConnectorsProps {
    /** List of connections to draw */
    connections: BracketConnection[];
    /** Container element ref for coordinate calculations */
    containerRef: React.RefObject<HTMLDivElement | null>;
    /** Map of room elements keyed by "matchIndex-roomIndex" */
    roomElements: Map<string, HTMLDivElement>;
}

interface ConnectionPath {
    key: string;
    d: string;
    labelX: number;
    labelY: number;
    rank: number;
}

/**
 * SVG overlay that draws connector lines between bracket rooms.
 * Shows which rank from which room feeds into each destination.
 */
export default function BracketConnectors({
    connections,
    containerRef,
    roomElements
}: BracketConnectorsProps) {
    const [paths, setPaths] = useState<ConnectionPath[]>([]);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const calculatePaths = () => {
            if (!containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();
            const scrollLeft = containerRef.current.scrollLeft;
            const scrollTop = containerRef.current.scrollTop;

            setDimensions({
                width: containerRef.current.scrollWidth,
                height: containerRef.current.scrollHeight
            });

            const newPaths: ConnectionPath[] = [];

            for (const conn of connections) {
                const sourceKey = `${conn.sourceMatchIndex}-${conn.sourceRoomIndex}`;
                const destKey = `${conn.destMatchIndex}-${conn.destRoomIndex}`;

                const sourceEl = roomElements.get(sourceKey);
                const destEl = roomElements.get(destKey);

                if (!sourceEl || !destEl) continue;

                const sourceRect = sourceEl.getBoundingClientRect();
                const destRect = destEl.getBoundingClientRect();

                // Calculate positions relative to the container
                const sourceX = sourceRect.right - containerRect.left + scrollLeft;
                const sourceY = sourceRect.top + sourceRect.height / 2 - containerRect.top + scrollTop;
                const destX = destRect.left - containerRect.left + scrollLeft;
                const destY = destRect.top + destRect.height / 2 - containerRect.top + scrollTop;

                // Create a bezier curve path
                const midX = (sourceX + destX) / 2;
                const controlOffset = Math.min(40, Math.abs(destX - sourceX) / 3);

                const d = `M ${sourceX} ${sourceY} 
                           C ${sourceX + controlOffset} ${sourceY}, 
                             ${destX - controlOffset} ${destY}, 
                             ${destX} ${destY}`;

                // Label position (near the middle of the curve)
                const labelX = midX;
                const labelY = (sourceY + destY) / 2 - 8;

                newPaths.push({
                    key: `${sourceKey}-${destKey}-${conn.rank}`,
                    d,
                    labelX,
                    labelY,
                    rank: conn.rank
                });
            }

            setPaths(newPaths);
        };

        // Calculate on mount and when connections change
        calculatePaths();

        // Recalculate on resize
        const resizeObserver = new ResizeObserver(calculatePaths);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        // Recalculate on scroll
        const handleScroll = () => calculatePaths();
        containerRef.current?.addEventListener("scroll", handleScroll);

        return () => {
            resizeObserver.disconnect();
            containerRef.current?.removeEventListener("scroll", handleScroll);
        };
    }, [connections, containerRef, roomElements]);

    if (paths.length === 0) return null;

    return (
        <svg
            className="absolute top-0 left-0 pointer-events-none"
            width={dimensions.width}
            height={dimensions.height}
            style={{ overflow: "visible" }}
        >
            <defs>
                <marker
                    id="bracket-arrow"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                    markerUnits="strokeWidth"
                >
                    <path d="M0,0 L0,6 L6,3 z" fill="currentColor" className="text-base-content/30" />
                </marker>
            </defs>
            {paths.map((path) => (
                <g key={path.key}>
                    <path
                        d={path.d}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-base-content/30"
                        markerEnd="url(#bracket-arrow)"
                    />
                    <circle
                        cx={path.labelX}
                        cy={path.labelY}
                        r="10"
                        fill="currentColor"
                        className="text-base-200"
                    />
                    <text
                        x={path.labelX}
                        y={path.labelY + 4}
                        textAnchor="middle"
                        fontSize="10"
                        fill="currentColor"
                        className="text-base-content font-bold"
                    >
                        {path.rank}
                    </text>
                </g>
            ))}
        </svg>
    );
}