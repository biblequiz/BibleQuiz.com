import type { APIRoute } from 'astro';
import { AppReleasePlatform, getAppReleaseManifest, getAvailableProducts } from 'utils/AppReleases';

export const prerender = true;

export async function getStaticPaths() {
    const products = await getAvailableProducts();

    const routes: { params: { product: string, platform: string } }[] = [];
    for (const product of products) {
        for (const platform of product.platforms) {
            routes.push({
                params: {
                    product: product.name,
                    platform: platform,
                },
            });
        }
    }

    return routes;
}

export const GET: APIRoute = async ({ params }) => {
    const { product, platform } = params;
    if (!product || !platform) {
        return new Response(JSON.stringify({ error: 'Product name and platform are required in the URL.' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    const manifest = await getAppReleaseManifest(
        product,
        platform as AppReleasePlatform);
    if (!manifest) {
        return new Response(JSON.stringify({ error: 'Product not found' }), {
            status: 404,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    delete (manifest as any).previous;

    return new Response(JSON.stringify(manifest, null, 2), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
        },
    });
};
