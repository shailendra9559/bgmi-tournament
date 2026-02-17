import BlogCard from '../../components/BlogCard';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://bgmi-tournament-production.up.railway.app');

export const metadata = {
    title: 'BGMI Blog — Tips, Guides, News & Esports Updates',
    description: 'Read the latest BGMI tips, guides, news, redeem codes, weapon tier lists, and esports updates. Your go-to resource for Battlegrounds Mobile India.',
    keywords: ['BGMI blog', 'BGMI tips', 'BGMI guides', 'BGMI news', 'BGMI redeem codes', 'BGMI esports'],
    openGraph: {
        title: 'BGMI Blog — Tips, Guides & News',
        description: 'Your go-to resource for BGMI tips, guides, news, redeem codes, and esports updates.',
        url: 'https://bgmi.blog/blog',
        type: 'website',
    },
};

const categoryInfo = {
    'news': { label: '📰 News & Updates', color: 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20' },
    'guides': { label: '📖 Guides', color: 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20' },
    'tips': { label: '💡 Tips & Tricks', color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20' },
    'esports': { label: '🏆 Esports', color: 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20' },
    'redeem-codes': { label: '🎁 Redeem Codes', color: 'bg-pink-500/10 border-pink-500/30 text-pink-400 hover:bg-pink-500/20' },
    'weapons': { label: '🔫 Weapons & Maps', color: 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' },
};

async function getArticles(category, page = 1) {
    try {
        const params = new URLSearchParams({ page, limit: 12 });
        if (category) params.append('category', category);
        const res = await fetch(`${API_URL}/api/articles?${params}`, { next: { revalidate: 60 } });
        if (!res.ok) return { articles: [], pagination: { page: 1, pages: 0, total: 0 } };
        return await res.json();
    } catch {
        return { articles: [], pagination: { page: 1, pages: 0, total: 0 } };
    }
}

async function getCategories() {
    try {
        const res = await fetch(`${API_URL}/api/articles/categories`, { next: { revalidate: 300 } });
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

export default async function BlogPage({ searchParams }) {
    const category = searchParams?.category || '';
    const page = parseInt(searchParams?.page) || 1;

    const [{ articles, pagination }, categories] = await Promise.all([
        getArticles(category, page),
        getCategories()
    ]);

    return (
        <>
            <Navbar />

            {/* Hero */}
            <section className="hero-pattern py-14 md:py-20">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white mb-4">
                        BGMI <span className="text-gradient">Blog</span>
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
                        Tips, guides, news, esports coverage & redeem codes — everything a BGMI player needs.
                    </p>
                </div>
            </section>

            {/* Category Filter */}
            <section className="py-6 border-b border-gray-800/50">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap gap-2 justify-center">
                        <Link href="/blog"
                            className={`text-sm px-4 py-2 rounded-full border transition-all ${!category
                                ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                            All Posts
                        </Link>
                        {Object.entries(categoryInfo).map(([slug, info]) => {
                            const count = categories.find(c => c.slug === slug)?.count || 0;
                            return (
                                <Link key={slug} href={`/blog?category=${slug}`}
                                    className={`text-sm px-4 py-2 rounded-full border transition-all ${category === slug
                                        ? info.color.replace('hover:', '')
                                        : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                                    {info.label} {count > 0 && <span className="ml-1 opacity-60">({count})</span>}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Articles Grid */}
            <section className="py-12 md:py-16">
                <div className="container mx-auto px-4">
                    {articles.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4">📝</div>
                            <p className="text-gray-400 text-xl font-heading">No articles found</p>
                            <p className="text-gray-500 mt-2">Check back soon — new content is added regularly!</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {articles.map(article => (
                                    <BlogCard key={article._id} article={article} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination.pages > 1 && (
                                <div className="flex justify-center items-center gap-3 mt-12">
                                    {page > 1 && (
                                        <Link href={`/blog?${category ? `category=${category}&` : ''}page=${page - 1}`}
                                            className="btn-outline px-5 py-2 text-sm">
                                            ← Prev
                                        </Link>
                                    )}
                                    <span className="text-gray-400 text-sm">
                                        Page {page} of {pagination.pages}
                                    </span>
                                    {page < pagination.pages && (
                                        <Link href={`/blog?${category ? `category=${category}&` : ''}page=${page + 1}`}
                                            className="btn-outline px-5 py-2 text-sm">
                                            Next →
                                        </Link>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* CTA */}
            <section className="py-12 bg-gray-900/30">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mb-3">
                        Ready to <span className="text-gradient">Compete</span>?
                    </h2>
                    <p className="text-gray-400 mb-6 max-w-lg mx-auto">
                        Put your BGMI knowledge to the test. Join a tournament and win real cash prizes.
                    </p>
                    <Link href="/#tournaments" className="btn-primary text-lg px-8 py-3 rounded-xl">
                        🏆 Join Tournament
                    </Link>
                </div>
            </section>

            <Footer />
        </>
    );
}
