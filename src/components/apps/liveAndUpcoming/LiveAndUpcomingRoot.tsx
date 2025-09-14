import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useEffect } from "react";

interface Props {
    loadingElementId: string;
}

export default function LiveAndUpcomingRoot({ loadingElementId }: Props) {
    
    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) fallback.style.display = "none";
    }, [loadingElementId]);

    return (
        <>
            <div className="badge badge-primary badge-danger text-lg p-4 mt-0">
                <FontAwesomeIcon icon="fas faTowerBroadcast" />
                <span className="font-bold">LIVE EVENTS</span>
            </div>
            <div className="flex flex-wrap gap-4">
                <a className="card w-96 card-sm shadow-sm border-2 border-solid mt-0" href="/">
                    <div className="card-body">
                        <div className="flex items-start gap-4">
                            <img
                                src="/assets/logos/tbq/tbq-logo.png"
                                alt="TBQ Logo"
                                className="w-20 h-20 flex-shrink-0 mt-2"
                            />
                            <div>
                                <h2 className="card-title mb-0">
                                    West Texas & Plains/West Texas Meet 1 in Amarillo
                                </h2>
                                <p className="mt-0">Sep 13, 2025</p>
                            </div>
                            <FontAwesomeIcon
                                icon="fas faArrowRight"
                                classNames={["icon text-2xl rtl:flip"]}
                            />
                        </div>
                    </div>
                </a>
                <div
                    className="card w-96 bg-base-200 card-sm shadow-sm border-2 border-solid mt-0"
                >
                    <div className="card-body">
                        <div className="flex items-start gap-4">
                            <img
                                src="/assets/logos/jbq/jbq-logo.png"
                                alt="JBQ Logo"
                                className="w-20 h-20 flex-shrink-0 mt-2"
                            />
                            <div>
                                <h2 className="card-title mb-0">
                                    West Texas & Plains/West Texas Meet 1 in Amarillo
                                </h2>
                                <p className="mt-0">Sep 13, 2025</p>
                            </div>
                            <FontAwesomeIcon
                                icon="fas faArrowRight"
                                classNames={["text-2xl rtl:flip"]}
                            />
                        </div>
                    </div>
                </div>
                <div
                    className="card w-96 bg-base-200 card-sm shadow-sm border-2 border-solid mt-0"
                >
                    <div className="card-body">
                        <div className="flex items-start gap-4">
                            <img
                                src="/assets/logos/tbq/tbq-logo.png"
                                alt="TBQ Logo"
                                className="w-20 h-20 flex-shrink-0 mt-2"
                            />
                            <div>
                                <h2 className="card-title mb-0">
                                    West Texas & Plains/West Texas Meet 1 in Amarillo
                                </h2>
                                <p className="mt-0">Sep 13, 2025</p>
                            </div>
                            <FontAwesomeIcon
                                icon="fas faArrowRight"
                                classNames={["text-2xl rtl:flip"]}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>);
}