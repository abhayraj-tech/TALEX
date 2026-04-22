const mongoose = require('mongoose');

const PublishedContentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: 'Untitled'
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true // 'image' or 'video'
    },
    filename: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PublishedContent', PublishedContentSchema);
