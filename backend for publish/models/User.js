const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const creditTransactionSchema = new mongoose.Schema({
    amount:      { type: Number, required: true },
    type:        { type: String, enum: ['earn', 'spend'], required: true },
    description: { type: String, required: true },
    createdAt:   { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema({
    name:     { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    email:    { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 8, select: false },
    avatar:   { type: String, default: '' },
    role:     { type: String, enum: ['learner', 'employer', 'admin'], default: 'learner' },

    // OAuth
    googleId: { type: String, sparse: true },
    githubId: { type: String, sparse: true },

    // Credits
    credits:             { type: Number, default: 100 },
    creditTransactions:  [creditTransactionSchema],

    // Learning
    badges:          [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
    coursesEnrolled: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    coursesCompleted:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],

    // Profile
    bio:    { type: String, maxlength: 500 },
    skills: [String],

    createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidate) {
    return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
