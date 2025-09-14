import React, { Suspense } from 'react';

interface Props {
    children: React.ReactNode;
}

export default function IslandLoader({ children }: Props) {
    return (
        <Suspense fallback={(<div>Loading ...</div>)}>
            {children}
        </Suspense>);
}