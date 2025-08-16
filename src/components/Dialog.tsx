interface Props {
    isOpen: boolean;
    width?: "full";
    children: React.ReactNode;
};

export default function Dialog({ isOpen, width, children }: Props) {

    const widthClass = width === "full" || width === undefined
        ? "w-11/12 max-w-full md:w-3/4 lg:w-1/2"
        : width;

    return (
        <dialog className={`modal ${isOpen ? "modal-open" : ""}`}>
            <div className={`modal-box ${widthClass}`}>
                {children}
            </div>
        </dialog>);
}