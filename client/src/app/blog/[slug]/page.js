import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import BlogCard from '../../../components/BlogCard';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:5000' : 'https://bgmi-tournament-production.up.railway.app');

async function getArticle(slug) {
    try {
        const res = await fetch(`${API_URL}/api/articles/${slug}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }) {
    const data = await getArticle(params.slug);
    if (!data) return { title: 'Article Not Found' };

    const { article } = data;
    return {
        title: article.seoTitle || article.title,
        description: article.seoDescription || article.excerpt,
        keywords: article.seoKeywords || article.tags,
        openGraph: {
            title: article.seoTitle || article.title,
            description: article.seoDescription || article.excerpt,
            url: `https://bgmi.blog/blog/${article.slug}`,
            type: 'article',
            publishedTime: article.createdAt,
            modifiedTime: article.updatedAt,
            images: article.coverImage ? [article.coverImage] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: article.seoTitle || article.title,
            description: article.seoDescription || article.excerpt,
        },
        alternates: {
            canonical: `/blog/${article.slug}`,
        },
    };
}

const categoryLabels = {
    'news': 'News & Updates',
    'guides': 'Guides',
    'tips': 'Tips & Tricks',
    'esports': 'Esports',
    'redeem-codes': 'Redeem Codes',
    'weapons': 'Weapons & Maps',
};

export default async function ArticlePage({ params }) {
    const data = await getArticle(params.slug);
    if (!data) notFound();

    const { article, related } = data;
    const date = new Date(article.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    // JSON-LD BlogPosting schema
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: article.title,
        description: article.excerpt,
        datePublished: article.createdAt,
        dateModified: article.updatedAt,
        author: {
            '@type': 'Person',
            name: article.author?.username || 'BGMI Blog',
        },
        publisher: {
            '@type': 'Organization',
            name: 'BGMI Tournament',
            url: 'https://bgmi.blog',
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://bgmi.blog/blog/${article.slug}`,
        },
        image: article.coverImage || undefined,
        keywords: article.tags?.join(', '),
    };

    // Breadcrumb schema
    const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://bgmi.blog' },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://bgmi.blog/blog' },
            { '@type': 'ListItem', position: 3, name: categoryLabels[article.category] || article.category, item: `https://bgmi.blog/blog?category=${article.category}` },
            { '@type': 'ListItem', position: 4, name: article.title },
        ]
    };

    return (
        <>
            <Navbar />

            {/* JSON-LD */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

            <article className="py-10 md:py-16">
                <div className="container mx-auto px-4 max-w-4xl">

                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8 flex-wrap">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <span>/</span>
                        <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
                        <span>/</span>
                        <Link href={`/blog?category=${article.category}`} className="hover:text-white transition-colors">
                            {categoryLabels[article.category]}
                        </Link>
                        <span>/</span>
                        <span className="text-gray-400 truncate max-w-[200px]">{article.title}</span>
                    </nav>

                    {/* Header */}
                    <header className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                {categoryLabels[article.category]}
                            </span>
                            <span className="text-gray-500 text-sm">{article.readTime} min read</span>
                            <span className="text-gray-500 text-sm">•</span>
                            <span className="text-gray-500 text-sm">{date}</span>
                        </div>

                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white leading-tight mb-4">
                            {article.title}
                        </h1>

                        <p className="text-gray-400 text-lg leading-relaxed">
                            {article.excerpt}
                        </p>

                        {/* Author + Stats */}
                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-700/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                    {(article.author?.username || 'B')[0].toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-white text-sm font-medium">{article.author?.username || 'BGMI Blog'}</div>
                                    <div className="text-gray-500 text-xs">{date}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-gray-500 text-sm">
                                <span>👁 {article.views} views</span>
                            </div>
                        </div>
                    </header>

                    {/* Cover Image */}
                    {article.coverImage && (
                        <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-10 bg-gray-800">
                            <img src={article.coverImage} alt={article.title}
                                className="w-full h-full object-cover" />
                        </div>
                    )}

                    {/* Article Content */}
                    <div className="article-content prose prose-invert prose-lg max-w-none"
                        dangerouslySetInnerHTML={{ __html: article.content }} />

                    {/* Tags */}
                    {article.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-gray-700/50">
                            <span className="text-gray-500 text-sm">Tags:</span>
                            {article.tags.map(tag => (
                                <Link key={tag} href={`/blog?tag=${tag}`}
                                    className="text-xs px-3 py-1 rounded-full bg-gray-800 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 transition-colors">
                                    #{tag}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Tournament CTA */}
                    <div className="mt-10 glass p-6 md:p-8 rounded-xl text-center">
                        <h3 className="text-xl md:text-2xl font-heading font-bold text-white mb-2">
                            Ready to Test Your Skills? 🎮
                        </h3>
                        <p className="text-gray-400 mb-4">
                            Put your BGMI knowledge into action. Join a tournament and win real cash prizes!
                        </p>
                        <Link href="/#tournaments" className="btn-primary inline-block px-8 py-3 rounded-xl">
                            🏆 Join Tournament Now
                        </Link>
                    </div>

                    {/* Related Articles */}
                    {related?.length > 0 && (
                        <section className="mt-14">
                            <h2 className="text-2xl font-heading font-bold text-white mb-6">
                                Related <span className="text-gradient">Articles</span>
                            </h2>
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {related.map(r => (
                                    <BlogCard key={r._id} article={r} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </article>

            <Footer />
        </>
    );
}
