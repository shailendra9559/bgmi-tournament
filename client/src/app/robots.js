export default function robots() {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/wallet/'],
        },
        sitemap: 'https://bgmi.blog/sitemap.xml',
    }
}
