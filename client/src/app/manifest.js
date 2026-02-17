export default function manifest() {
    return {
        name: 'BGMI Tournament & Blog',
        short_name: 'BGMI Tournament',
        description: 'Join daily BGMI tournaments, win real cash prizes, and read the latest esports news.',
        start_url: '/',
        display: 'standalone',
        background_color: '#030712', // gray-950
        theme_color: '#030712',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
