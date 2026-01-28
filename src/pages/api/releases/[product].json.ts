import type { APIRoute } from 'astro';
import { getReleaseData, getAvailableProducts } from 'utils/AppReleases';

export const prerender = true;

export function getStaticPaths() {
    return getAvailableProducts().map((product) => ({
        params: { product },
    }));
}

export const GET: APIRoute = ({ params }) => {
    const { product } = params;

    if (!product) {
        return new Response(JSON.stringify({ error: 'Product name required' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    const releaseData = getReleaseData(product);

    if (!releaseData) {
        return new Response(JSON.stringify({ error: 'Product not found' }), {
            status: 404,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    return new Response(JSON.stringify(releaseData, null, 2), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
        },
    });
};
