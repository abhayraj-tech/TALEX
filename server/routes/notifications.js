const express = require('express');
const { getCollection } = require('../config/db');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, (req, res) => {
  try {
    const notifications = getCollection('notifications');
    // Find notifications for the current user, sorted by date (newest first)
    const userNotifications = notifications.find({ userId: req.user._id })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ success: true, notifications: userNotifications });
  } catch (err) {
    console.error('[NOTIFICATIONS] Fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, (req, res) => {
  try {
    const notifications = getCollection('notifications');
    const notification = notifications.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.userId !== req.user._id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const updated = notifications.updateById(req.params.id, { isRead: true });

    res.json({ success: true, notification: updated });
  } catch (err) {
    console.error('[NOTIFICATIONS] Update error:', err);
    res.status(500).json({ success: false, message: 'Server error updating notification' });
  }
});

// @desc    Create a notification (Internal/Testing)
// @route   POST /api/notifications
// @access  Private
router.post('/', protect, (req, res) => {
  try {
    const { title, message } = req.body;
    const notifications = getCollection('notifications');
    
    const newNotif = notifications.create({
      userId: req.user._id,
      title,
      message,
      isRead: false
    });

    res.status(201).json({ success: true, notification: newNotif });
  } catch (err) {
    console.error('[NOTIFICATIONS] Create error:', err);
    res.status(500).json({ success: false, message: 'Server error creating notification' });
  }
});

module.exports = router;
