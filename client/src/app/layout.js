import './globals.css'
import Providers from '../components/Providers'
import Script from 'next/script'

export const metadata = {
    metadataBase: new URL('https://bgmi.blog'),
    title: {
        default: 'BGMI Tournament & Blog — Play, Win, Learn | bgmi.blog',
        template: '%s | BGMI Tournament'
    },
    description: 'India\'s #1 BGMI Community. Read latest BGMI news, tips & guides, get redeem codes, and join daily tournaments to win real cash prizes.',
    keywords: ['BGMI tournament', 'BGMI blog', 'BGMI esports', 'BGMI redeem codes', 'BGMI tips', 'play BGMI earn money', 'battlegrounds mobile india'],
    openGraph: {
        type: 'website',
        locale: 'en_IN',
        url: 'https://bgmi.blog/',
        siteName: 'BGMI Tournament',
        icons: {
            icon: '/favicon.ico',
        }
    },
    alternates: {
        canonical: '/',
    },
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet" />
            </head>
            <body className="font-body bg-gray-950 min-h-screen flex flex-col">
                <Providers>
                    {children}
                </Providers>

                {/* Structured Data for Organization */}
                <Script id="struct-data" type="application/ld+json">
                    {`
                    {
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "name": "BGMI Tournament",
                        "url": "https://bgmi.blog",
                        "logo": "https://bgmi.blog/logo.png",
                        "description": "Platform for BGMI tournaments, news, and guides.",
                        "sameAs": [
                            "https://instagram.com/bgmi.blog",
                            "https://youtube.com/@bgmi.blog"
                        ]
                    }
                    `}
                </Script>
            </body>
        </html>
    )
}
