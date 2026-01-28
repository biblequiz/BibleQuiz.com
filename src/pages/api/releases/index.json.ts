import type { APIRoute } from 'astro';
import { getAvailableProducts, getReleaseData } from '../../../utils/AppReleases';

export const prerender = true;

export const GET: APIRoute = () => {
  const products = getAvailableProducts();
  
  const index = {
    products: products.map((product) => ({
      name: product,
      url: `/api/releases/${product}.json`,
    })),
    generatedAt: new Date().toISOString(),
  };

  return new Response(JSON.stringify(index, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
