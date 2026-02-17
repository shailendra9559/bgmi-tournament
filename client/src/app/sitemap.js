const API_URL = 'https://bgmi-tournament-production.up.railway.app'; // Hardcoded for reliability in sitemap generation

export default async function sitemap() {
    const routes = [
        '',
        '/login',
        '/wallet',
        '/blog',
    ].map((route) => ({
        url: `https://bgmi.blog${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: route === '' ? 1 : 0.8,
    }));

    try {
        const res = await fetch(`${API_URL}/api/articles/slugs`, { next: { revalidate: 3600 } });
        if (res.ok) {
            const slugs = await res.json();
            const blogRoutes = slugs.map((article) => ({
                url: `https://bgmi.blog/blog/${article.slug}`,
                lastModified: new Date(article.updatedAt),
                changeFrequency: 'weekly',
                priority: 0.7,
            }));
            return [...routes, ...blogRoutes];
        }
    } catch (err) {
        console.error('Sitemap generation failed:', err);
    }

    return routes;
}
