import Link from 'next/link';

const categoryColors = {
    'news': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'guides': 'bg-green-500/20 text-green-400 border-green-500/30',
    'tips': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'esports': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'redeem-codes': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'weapons': 'bg-red-500/20 text-red-400 border-red-500/30',
};

const categoryLabels = {
    'news': 'News',
    'guides': 'Guides',
    'tips': 'Tips & Tricks',
    'esports': 'Esports',
    'redeem-codes': 'Redeem Codes',
    'weapons': 'Weapons & Maps',
};

export default function BlogCard({ article }) {
    const categoryColor = categoryColors[article.category] || categoryColors['news'];
    const categoryLabel = categoryLabels[article.category] || article.category;
    const date = new Date(article.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
    });

    return (
        <Link href={`/blog/${article.slug}`} className="group block">
            <article className="card card-hover h-full flex flex-col">
                {/* Cover Image */}
                {article.coverImage && (
                    <div className="relative w-full h-44 rounded-lg overflow-hidden mb-4 bg-gray-700/50">
                        <img src={article.coverImage} alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                )}

                {/* Category + Meta */}
                <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${categoryColor}`}>
                        {categoryLabel}
                    </span>
                    <span className="text-gray-500 text-xs">{article.readTime} min read</span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-heading font-bold text-white mb-2 group-hover:text-gradient transition-all line-clamp-2">
                    {article.title}
                </h3>

                {/* Excerpt */}
                <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 flex-grow">
                    {article.excerpt}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700/50">
                    <span className="text-gray-500 text-xs">{date}</span>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>👁 {article.views || 0}</span>
                    </div>
                </div>
            </article>
        </Link>
    );
}
