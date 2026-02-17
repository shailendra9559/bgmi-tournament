const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    excerpt: { type: String, required: true, maxlength: 300 },
    content: { type: String, required: true },
    coverImage: { type: String, default: '' },

    category: {
        type: String,
        enum: ['news', 'guides', 'tips', 'esports', 'redeem-codes', 'weapons'],
        required: true,
        index: true
    },
    tags: [{ type: String, lowercase: true, trim: true }],

    // SEO
    seoTitle: { type: String, maxlength: 70 },
    seoDescription: { type: String, maxlength: 160 },
    seoKeywords: [{ type: String }],

    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },

    views: { type: Number, default: 0 },
    readTime: { type: Number, default: 1 }, // minutes

    featured: { type: Boolean, default: false }
}, { timestamps: true });

// Auto-generate slug from title
ArticleSchema.pre('validate', function (next) {
    if (this.isModified('title') && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
    // Auto-calculate read time (~200 words per minute)
    if (this.isModified('content') && this.content) {
        const wordCount = this.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
        this.readTime = Math.max(1, Math.ceil(wordCount / 200));
    }
    next();
});

// Text index for search
ArticleSchema.index({ title: 'text', excerpt: 'text', tags: 'text' });
ArticleSchema.index({ createdAt: -1 });
ArticleSchema.index({ views: -1 });

module.exports = mongoose.model('Article', ArticleSchema);
