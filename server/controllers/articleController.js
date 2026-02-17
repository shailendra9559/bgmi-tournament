const Article = require('../models/Article');
const sanitizeHtml = require('sanitize-html');

// GET /api/articles — Public listing with pagination, category/tag filter, search
exports.getArticles = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
        const { category, tag, search } = req.query;
        const filter = { status: 'published' };

        if (category) filter.category = String(category);
        if (tag) filter.tags = String(tag).toLowerCase();
        if (search) filter.$text = { $search: search };

        const articles = await Article.find(filter)
            .select('-content')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('author', 'username profilePicture')
            .lean();

        const total = await Article.countDocuments(filter);

        res.json({
            articles,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/articles/featured — Top articles for homepage
exports.getFeaturedArticles = async (req, res) => {
    try {
        const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 6));

        // Featured articles first, then most recent
        const articles = await Article.find({ status: 'published' })
            .select('-content')
            .sort({ featured: -1, createdAt: -1 })
            .limit(parseInt(limit))
            .populate('author', 'username profilePicture')
            .lean();

        res.json(articles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/articles/categories — Category list with counts
exports.getCategories = async (req, res) => {
    try {
        const categories = await Article.aggregate([
            { $match: { status: 'published' } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const categoryInfo = {
            'news': { label: 'News & Updates', emoji: '📰' },
            'guides': { label: 'Guides', emoji: '📖' },
            'tips': { label: 'Tips & Tricks', emoji: '💡' },
            'esports': { label: 'Esports', emoji: '🏆' },
            'redeem-codes': { label: 'Redeem Codes', emoji: '🎁' },
            'weapons': { label: 'Weapons & Maps', emoji: '🔫' }
        };

        const result = categories.map(c => ({
            slug: c._id,
            ...categoryInfo[c._id],
            count: c.count
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/articles/slugs — All published slugs (for sitemap)
exports.getAllSlugs = async (req, res) => {
    try {
        const slugs = await Article.find({ status: 'published' })
            .select('slug updatedAt category')
            .lean();
        res.json(slugs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/articles/:slug — Single article by slug
exports.getArticleBySlug = async (req, res) => {
    try {
        const article = await Article.findOneAndUpdate(
            { slug: req.params.slug, status: 'published' },
            { $inc: { views: 1 } },
            { new: true }
        ).populate('author', 'username profilePicture');

        if (!article) return res.status(404).json({ message: 'Article not found' });

        // Get related articles (same category, different article)
        const related = await Article.find({
            status: 'published',
            category: article.category,
            _id: { $ne: article._id }
        })
            .select('-content')
            .sort({ views: -1 })
            .limit(3)
            .lean();

        res.json({ article, related });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/articles — Admin create
exports.createArticle = async (req, res) => {
    try {
        const articleData = { ...req.body, author: req.user.id };

        // Sanitize content
        if (articleData.content) {
            articleData.content = sanitizeHtml(articleData.content, {
                allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h2', 'h3', 'code', 'pre', 'iframe']),
                allowedAttributes: {
                    ...sanitizeHtml.defaults.allowedAttributes,
                    'img': ['src', 'alt', 'class'],
                    'iframe': ['src', 'width', 'height', 'frameborder', 'allowfullscreen']
                },
                allowedIframeHostnames: ['www.youtube.com']
            });
        }

        const article = await Article.create(articleData);
        res.status(201).json(article);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'An article with this slug already exists' });
        }
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/articles/:id — Admin update
exports.updateArticle = async (req, res) => {
    try {
        const article = await Article.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                content: req.body.content ? sanitizeHtml(req.body.content, {
                    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h2', 'h3', 'code', 'pre', 'iframe']),
                    allowedAttributes: {
                        ...sanitizeHtml.defaults.allowedAttributes,
                        'img': ['src', 'alt', 'class'],
                        'iframe': ['src', 'width', 'height', 'frameborder', 'allowfullscreen']
                    },
                    allowedIframeHostnames: ['www.youtube.com']
                }) : undefined
            },
            { new: true, runValidators: true }
        );
        if (!article) return res.status(404).json({ message: 'Article not found' });
        res.json(article);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/articles/:id — Admin delete
exports.deleteArticle = async (req, res) => {
    try {
        const article = await Article.findByIdAndDelete(req.params.id);
        if (!article) return res.status(404).json({ message: 'Article not found' });
        res.json({ message: 'Article deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
