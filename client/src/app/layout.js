import './globals.css'
import Providers from '../components/Providers'
import Script from 'next/script'
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata = {
    metadataBase: new URL('https://bgmi.blog'),
    title: {
        default: 'BGMI Tournament & Blog — Play, Win Real Money | bgmi.blog',
        template: '%s | BGMI Tournament'
    },
    description: 'India\'s #1 BGMI Tournament Platform. Join daily matches with Free Entry & Paid options to win Real Cash. Read latest BGMI news, tips, guides & get redeem codes.',
    keywords: [
        'BGMI tournament', 'BGMI tournament app', 'play BGMI earn money',
        'BGMI daily matches', 'free entry bgmi tournament', 'real money gaming',
        'BGMI blog', 'BGMI esports', 'BGMI redeem codes', 'BGMI tips and tricks',
        'battlegrounds mobile india', 'krafton'
    ],
    openGraph: {
        type: 'website',
        locale: 'en_IN',
        url: 'https://bgmi.blog/',
        siteName: 'BGMI Tournament & Blog',
        title: 'Play BGMI Tournaments & Win Real Cash | BGMI Blog',
        description: 'Join the ultimate BGMI community. Daily tournaments, huge prize pools, and instant withdrawals. Plus, get the latest news and guides.',
        images: [
            {
                url: '/og-image.jpg', // Ensure this image exists slightly later or use a placeholder
                width: 1200,
                height: 630,
                alt: 'BGMI Tournament Platform',
            },
        ],
        icons: {
            icon: '/favicon.ico',
        }
    },
    twitter: {
        card: 'summary_large_image',
        title: 'BGMI Tournament — Play & Win Cash',
        description: 'Daily BGMI Tournaments with Instant Payouts. Join now!',
        // images: ['/og-image.jpg'], // Optional: Add if we have one
    },
    verification: {
        google: 'E197F9NMfhh96LThYKzzBRbLt5M5-u1ChHjrKipe2V8', // Verified code provided by user on 2026-02-18
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

                {/* Google Analytics 4 */}
                <Script src="https://www.googletagmanager.com/gtag/js?id=G-2S1SJYFMCG" strategy="afterInteractive" />
                <Script id="google-analytics" strategy="afterInteractive">
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', 'G-2S1SJYFMCG');
                    `}
                </Script>
            </head>
            <body className="font-body bg-gray-950 min-h-screen flex flex-col">
                <Providers>
                    {children}
                    <SpeedInsights />
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
