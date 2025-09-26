import { useEffect } from "react";
import { useRouteError, isRouteErrorResponse } from "react-router-dom";

interface Props {
    loadingElementId: string;
}

export default function ErrorPage({ loadingElementId }: Props) {
    const error = useRouteError();

    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) fallback.style.display = "none";
    }, [loadingElementId]);

    const getErrorInfo = () => {
        if (isRouteErrorResponse(error)) {
            return {
                status: error.status,
                statusText: error.statusText,
                message: error.statusText
            };
        }

        if (error instanceof Error) {
            return {
                status: 500,
                statusText: "Internal Error",
                message: error.message
            };
        }

        return {
            status: 500,
            statusText: "Unknown Error",
            message: "An unexpected error occurred"
        };
    };

    const { status, statusText, message } = getErrorInfo();

    return (
        <div className="hero-content text-center">
            <div className="w-full">
                <h1 className="text-5xl font-bold">{status} - {statusText}</h1>
                <p className="py-6">
                    {message}
                </p>
            </div>
        </div>);
}