interface Props {
}

export default function NotFoundError({ }: Props) {
    return (
        <div className="hero-content text-center">
            <div className="w-full">
                <h1 className="text-5xl font-bold">404 - Not Found</h1>
                <p className="py-6">
                    The page you are looking for cannot be found. Check the address or try the search bar.
                </p>
            </div>
        </div>);
}