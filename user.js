const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // <--- CONFIRM KIYA GAYA

const userSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    coins: {
        type: Number,
        default: 0
    },
    myReferralCode: {
        type: String,
        unique: true,
        required: true,
    },
    referredBy: {
        type: String,
        default: null
    },
    totalAdsWatchedToday: {
        type: Number,
        default: 0
    },
    lastAdWatchDate: {
        type: Date,
        default: Date.now
    },
    totalEarningsAllTime: {
        type: Number,
        default: 0
    },
    totalReferrals: {
        type: Number,
        default: 0
    },
    totalAdsWatchedAllTime: {
        type: Number,
        default: 0
    },
    redeem100Count: { type: Number, default: 0 },
    redeem200Count: { type: Number, default: 0 },
    redeem300Count: { type: Number, default: 0 },
    redeemHistory: [{
        amount: Number,
        coins: Number,
        status: { type: String, default: 'pending' },
        date: { type: Date, default: Date.now }
    }]
});

// Pre-save hook for password hashing and referral code generation
userSchema.pre('save', async function (next) {
    const user = this;

    // Password Hashing
    if (user.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
    }

    // Referral Code Generation (Only on creation)
    if (user.isNew && !user.myReferralCode) {
        // Simple random 6-digit code generate kiya
        const uniqueId = Math.floor(100000 + Math.random() * 900000).toString();
        user.myReferralCode = uniqueId; 

        // Agar kisi ne refer kiya hai, toh referral logic yahan aayega (abhi skip kiya)
    }

    next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
