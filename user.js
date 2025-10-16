const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    minlength: [10, 'Phone number must be 10 digits'],
    maxlength: [10, 'Phone number must be 10 digits']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  coins: {
    type: Number,
    default: 0,
    min: 0
  },
  referredBy: {
    type: String,
    default: null
  },
  myReferralCode: {
    type: String,
    unique: true
  },
  totalAdsWatchedToday: {
    type: Number,
    default: 0,
    min: 0
  },
  lastAdWatchDate: {
    type: Date,
    default: null
  },
  // Referral Bonus Tracking
  referralBonusReceived: {
    type: Boolean,
    default: false
  },
  referredUserBonus25Ads: {
    type: Boolean,
    default: false
  },
  referrerBonus50Ads: {
    type: Boolean,
    default: false
  },
  // Redeem Limits for ₹100 (Max 2 times)
  redeem100Count: {
    type: Number,
    default: 0,
    min: 0,
    max: 2
  },
  redeem100Completed: {
    type: Boolean,
    default: false
  },
  // Redeem Limits for ₹200 (Max 1 time)
  redeem200Count: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  redeem200Completed: {
    type: Boolean,
    default: false
  },
  // Redeem Limits for ₹300 (Max 1 time)
  redeem300Count: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  redeem300Completed: {
    type: Boolean,
    default: false
  },
  // Redeem History
  redeemHistory: [{
    amount: {
      type: Number,
      required: true
    },
    coins: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    }
  }],
  // Total Earnings Tracking
  totalEarningsAllTime: {
    type: Number,
    default: 0
  },
  totalAdsWatchedAllTime: {
    type: Number,
    default: 0
  },
  totalReferrals: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save middleware to set myReferralCode (use phone number as referral code)
userSchema.pre('save', func
