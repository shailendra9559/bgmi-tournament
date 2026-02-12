const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { protect, adminOnly } = require('../middleware/auth');

// ─── Specific routes MUST come before /:id ───

// Public
router.get('/', matchController.getMatches);

// User
router.get('/my', protect, matchController.getMyMatches);
router.post('/join', protect, matchController.joinMatch);

// Admin
router.get('/admin/all', protect, adminOnly, matchController.getAllMatches);
router.post('/create', protect, adminOnly, matchController.createMatch);

// Parameterized routes (LAST — /:id catches everything)
router.get('/:id', matchController.getMatch);
router.put('/:id', protect, adminOnly, matchController.updateMatch);
router.delete('/:id', protect, adminOnly, matchController.deleteMatch);
router.put('/:id/status', protect, adminOnly, matchController.changeMatchStatus);
router.delete('/:matchId/participant/:userId', protect, adminOnly, matchController.removeParticipant);

module.exports = router;
