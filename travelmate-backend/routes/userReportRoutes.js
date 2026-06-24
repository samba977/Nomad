// routes/userReportRoutes.js
const express = require('express');
const router = express.Router();
const urc = require('../controllers/userReportController');

/**
 * NOTE:
 * If you already have real middlewares, import and use them here:
 *   const { requireAuth, requireAdmin } = require('../middleware/auth');
 * For now, these are no-op placeholders so this file works out of the box.
 */
const requireAuth = (req, _res, next) => { next(); };   // replace with your auth check
const requireAdmin = (req, _res, next) => { next(); };  // replace with your admin check

// ───────────────────────────────────────────────────────────────────────────────
// Create a user report (regular user action)
router.post('/', requireAuth, urc.createUserReport);

// Admin: list all (optional filter by ?status=open|reviewing|resolved|rejected)
router.get('/', requireAdmin, urc.getAllUserReports);

// Admin: get single report by id
router.get('/:id', requireAdmin, urc.getUserReportById);

// Admin: update status/notes for a report
router.patch('/:id/status', requireAdmin, urc.updateUserReportStatus);

// Admin: delete a report (you asked to manage with Delete action)
router.delete('/:id', requireAdmin, urc.deleteUserReport);

// ───────────────────────────────────────────────────────────────────────────────
module.exports = router;
