import './globals.css'
import Providers from '../components/Providers'

export const metadata = {
    title: 'BGMI Tournament - Play & Win',
    description: 'Join BGMI tournaments, compete with players, and win real money!',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="min-h-screen gradient-bg">
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
