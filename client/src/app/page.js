import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ClientHome from '../components/ClientHome';
import BlogCard from '../components/BlogCard';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:5000' : 'https://bgmi-tournament-production.up.railway.app');

async function getFeaturedArticles() {
    try {
        const res = await fetch(`${API_URL}/api/articles/featured?limit=6`, { next: { revalidate: 60 } });
        if (!res.ok) return [];
        return await res.json();
    } catch (err) {
        console.error(`Error fetching articles from ${API_URL}:`, err.message);
        return [];
    }
}

export default async function Home() {
    const articles = await getFeaturedArticles();

    const categories = [
        { label: 'Guides', slug: 'guides', icon: '📖', color: 'bg-green-500/10 border-green-500/20 text-green-400' },
        { label: 'News', slug: 'news', icon: '📰', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
        { label: 'Redeem Codes', slug: 'redeem-codes', icon: '🎁', color: 'bg-pink-500/10 border-pink-500/20 text-pink-400' },
        { label: 'Tips & Tricks', slug: 'tips', icon: '💡', color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
        { label: 'Weapons', slug: 'weapons', icon: '🔫', color: 'bg-red-500/10 border-red-500/20 text-red-400' },
        { label: 'Esports', slug: 'esports', icon: '🏆', color: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
    ];

    return (
        <>
            <Navbar />

            {/* ═══════════ NEW HERO SECTION ═══════════ */}
            <section className="hero-pattern relative overflow-hidden">
                <div className="container mx-auto px-4 py-20 md:py-28 text-center relative z-10">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-1.5 mb-6 animate-slide-up">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        <span className="text-blue-300 text-sm font-medium">#1 BGMI Community & Tournament Platform</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-6 animate-slide-up delay-100 leading-tight">
                        Master the <span className="text-gradient">Unknown</span>,<br className="hidden md:block" />
                        Win Real <span className="text-gradient-blue">Cash</span>
                    </h1>

                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-slide-up delay-200">
                        Get the latest BGMI tips, redeem codes, and esports news.
                        Then put your skills to the test in our daily tournaments.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up delay-300">
                        <Link href="/blog" className="btn-primary text-lg px-8 py-4 rounded-xl shadow-lg shadow-blue-500/25">
                            📖 Read Guides
                        </Link>
                        <Link href="#tournaments" className="btn-outline text-lg px-8 py-4 rounded-xl">
                            🏆 Join Tournaments
                        </Link>
                    </div>

                    {/* Quick Category Links */}
                    <div className="mt-16 flex flex-wrap justify-center gap-3 animate-slide-up delay-400 max-w-4xl mx-auto">
                        {categories.map((cat) => (
                            <Link key={cat.slug} href={`/blog?category=${cat.slug}`}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium hover:scale-105 transition-transform ${cat.color}`}>
                                <span>{cat.icon}</span> {cat.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Background decorative elements */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none"></div>
            </section>

            {/* ═══════════ LATEST ARTICLES ═══════════ */}
            <section className="py-12 bg-gray-900/20 border-b border-gray-800/50">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mb-2">
                                Latest <span className="text-gradient">Insights</span>
                            </h2>
                            <p className="text-gray-400 text-sm md:text-base">Stay updated with the meta</p>
                        </div>
                        <Link href="/blog" className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1">
                            View All <span className="text-xl">→</span>
                        </Link>
                    </div>

                    {articles.length > 0 ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {articles.map(article => (
                                <BlogCard key={article._id} article={article} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 flex flex-col items-center justify-center min-h-[300px]">
                            <div className="text-6xl mb-4">📝</div>
                            <p className="text-gray-500">No articles available</p>
                        </div>
                    )}
                </div>
            </section>

            {/* ═══════════ CLIENT INTERACTIVE SECTIONS ═══════════ */}
            <ClientHome />

            <Footer />
        </>
    );
}
