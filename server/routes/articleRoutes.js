const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
    getArticles,
    getFeaturedArticles,
    getCategories,
    getAllSlugs,
    getArticleBySlug,
    createArticle,
    updateArticle,
    deleteArticle
} = require('../controllers/articleController');

// Public routes
router.get('/', getArticles);
router.get('/featured', getFeaturedArticles);
router.get('/categories', getCategories);
router.get('/slugs', getAllSlugs);
router.get('/:slug', getArticleBySlug);

// Admin routes
router.post('/', protect, adminOnly, createArticle);
router.put('/:id', protect, adminOnly, updateArticle);
router.delete('/:id', protect, adminOnly, deleteArticle);

module.exports = router;
