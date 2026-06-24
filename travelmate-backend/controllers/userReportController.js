// controllers/userReportController.js
const UserReport = require('../models/UserReport');
const User = require('../models/User');

/**
 * Create a new user report
 * Body: { reporterId?, targetUserId, reason, details?, evidenceUrls?[] }
 * - If you have auth middleware, reporterId will come from req.user.id
 */
exports.createUserReport = async (req, res) => {
  try {
    const reporterId = req.user?.id || req.body.reporterId; // prefer token if available
    const { targetUserId, reason, details, evidenceUrls } = req.body;

    if (!reporterId || !targetUserId || !reason) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    if (String(reporterId) === String(targetUserId)) {
      return res.status(400).json({ message: "You can't report yourself." });
    }

    // Optional but recommended: ensure both users exist
    const [reporter, target] = await Promise.all([
      User.findById(reporterId).select('_id'),
      User.findById(targetUserId).select('_id'),
    ]);
    if (!reporter || !target) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const report = await UserReport.create({
      reporter: reporterId,
      targetUser: targetUserId,
      reason,
      details,
      evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls : [],
    });

    res.status(201).json(report);
  } catch (err) {
    console.error('createUserReport error:', err);
    res.status(500).json({ message: 'Server error creating user report.' });
  }
};

/**
 * Get all user reports (admin)
 * Query: ?status=open|reviewing|resolved|rejected (optional)
 *        ?q=free text (optional - not required by frontend but supported)
 */
exports.getAllUserReports = async (req, res) => {
  try {
    const { status, q } = req.query;

    const filter = {};
    if (status) filter.status = status;

    // Optional server-side search support (frontend also filters client-side)
    if (q && String(q).trim()) {
      const text = String(q).trim();
      filter.$or = [
        { reason: new RegExp(text, 'i') },
        { details: new RegExp(text, 'i') },
        { adminNotes: new RegExp(text, 'i') },
      ];
    }

    const reports = await UserReport.find(filter)
      .populate('reporter', 'fullName email')
      .populate('targetUser', 'fullName email')
      .populate('handledBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    console.error('getAllUserReports error:', err);
    res.status(500).json({ message: 'Server error fetching user reports.' });
  }
};

/**
 * Get a single user report by id (admin)
 */
exports.getUserReportById = async (req, res) => {
  try {
    const report = await UserReport.findById(req.params.id)
      .populate('reporter', 'fullName email')
      .populate('targetUser', 'fullName email')
      .populate('handledBy', 'fullName email');

    if (!report) return res.status(404).json({ message: 'Report not found.' });
    res.json(report);
  } catch (err) {
    console.error('getUserReportById error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Update status and/or adminNotes for a report (admin)
 * Body: { status?, adminNotes? }
 */
exports.updateUserReportStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const allowed = ['open', 'reviewing', 'resolved', 'rejected'];

    if (status && !allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const updates = {};
    if (status) updates.status = status;
    if (typeof adminNotes !== 'undefined') updates.adminNotes = adminNotes;

    // When admins move it to any terminal/non-open state, record handler
    if (status && ['reviewing', 'resolved', 'rejected'].includes(status)) {
      updates.handledBy = req.user?.id || updates.handledBy;
    }

    const report = await UserReport.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('reporter', 'fullName email')
      .populate('targetUser', 'fullName email')
      .populate('handledBy', 'fullName email');

    if (!report) return res.status(404).json({ message: 'Report not found.' });
    res.json(report);
  } catch (err) {
    console.error('updateUserReportStatus error:', err);
    res.status(500).json({ message: 'Server error updating user report.' });
  }
};

/**
 * Delete a report (admin)
 */
exports.deleteUserReport = async (req, res) => {
  try {
    const doc = await UserReport.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Report not found.' });
    res.json({ message: 'Deleted.' });
  } catch (err) {
    console.error('deleteUserReport error:', err);
    res.status(500).json({ message: 'Server error deleting report.' });
  }
};
