const ChatReport = require('../models/ChatReport');
const Message = require('../models/Message');
const User = require('../models/User');

// POST /api/reports/chat
exports.reportChat = async (req, res) => {
  try {
    const { messageId, reportedUserId, reason } = req.body;

    if (!messageId || !reportedUserId || !reason) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }

    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({ message: "Reported user not found." });
    }

    const report = new ChatReport({
      messageId,
      reportedBy: req.user._id,
      reportedUser: reportedUserId,
      reason,
    });
    await report.save();

    res.status(201).json({ message: "Message reported successfully." });
  } catch (err) {
    console.error("ReportChat Error:", err);
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

// GET /api/reports/admin/chat
exports.getAllChatReports = async (req, res) => {
  try {
    const reports = await ChatReport.find()
      .populate('messageId')
      .populate('reportedBy', 'fullName email')
      .populate('reportedUser', 'fullName email');
    res.json(reports);
  } catch (err) {
    console.error("GetAllChatReports Error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// DELETE /api/reports/admin/chat/:id
exports.deleteChatReport = async (req, res) => {
  try {
    await ChatReport.findByIdAndDelete(req.params.id);
    res.json({ message: "Report deleted" });
  } catch (err) {
    console.error("DeleteChatReport Error:", err);
    res.status(500).json({ message: "Failed to delete report" });
  }
};
