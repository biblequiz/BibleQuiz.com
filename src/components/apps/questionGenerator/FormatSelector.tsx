interface Props {
    font: string;
    setFont: (font: string) => void;

    size: number;
    setSize: (size: number) => void;

    columns: number;
    setColumns: (columns: number) => void;
}

const FONT_OPTIONS = ["Arial", "Times New Roman"];
const SIZE_OPTIONS = [10, 11, 12, 13, 14, 15, 16, 17];
const COLUMN_OPTIONS = [1, 2];

export const DEFAULT_FONT = FONT_OPTIONS[1];
export const DEFAULT_SIZE = SIZE_OPTIONS[0];
export const DEFAULT_COLUMN = COLUMN_OPTIONS[1];

export default function FormatSelector({
    font,
    setFont,
    size,
    setSize,
    columns,
    setColumns }: Props) {

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="w-full mt-0">
                <label className="label">
                    <span className="label-text font-medium">Font</span>
                    <span className="label-text-alt text-error">*</span>
                </label>
                <select
                    name="print-font"
                    className="select select-bordered w-full mt-0"
                    value={font}
                    onChange={e => setFont(e.target.value)}
                    required
                >
                    {FONT_OPTIONS.map((font, index) => (
                        <option key={`font_${index}`} value={font}>{font}</option>
                    ))}
                </select>
            </div>
            <div className="w-full mt-0">
                <label className="label">
                    <span className="label-text font-medium">Font Size</span>
                    <span className="label-text-alt text-error">*</span>
                </label>
                <select
                    name="print-font-size"
                    className="select select-bordered w-full mt-0"
                    value={size}
                    onChange={e => setSize(Number(e.target.value))}
                    required
                >
                    {SIZE_OPTIONS.map((size, index) => (
                        <option key={`size_${index}`} value={size}>{size}</option>
                    ))}
                </select>
            </div>
            <div className="w-full mt-0">
                <label className="label">
                    <span className="label-text font-medium">Columns</span>
                    <span className="label-text-alt text-error">*</span>
                </label>
                <select
                    name="print-columns"
                    className="select select-bordered w-full mt-0"
                    value={columns}
                    onChange={e => setColumns(Number(e.target.value))}
                    required
                >
                    {COLUMN_OPTIONS.map((columns, index) => (
                        <option key={`columns_${index}`} value={columns}>{columns}</option>
                    ))}
                </select>
            </div>
        </div>);
}