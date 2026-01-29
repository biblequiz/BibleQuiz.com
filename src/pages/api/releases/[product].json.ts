import type { APIRoute } from 'astro';
import { getAppReleaseManifest, getAvailableProducts } from 'utils/AppReleases';

export const prerender = true;

export async function getStaticPaths() {
    const products = await getAvailableProducts();
    return products.map((product) => ({
        params: { product },
    }));
}

export const GET: APIRoute = async ({ params }) => {
    const { product } = params;
    if (!product) {
        return new Response(JSON.stringify({ error: 'Product name is required in the URL.' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    const manifest = await getAppReleaseManifest(product);
    if (!manifest) {
        return new Response(JSON.stringify({ error: 'Product not found' }), {
            status: 404,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    return new Response(JSON.stringify(manifest, null, 2), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
        },
    });
};
