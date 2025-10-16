const mongoose = require('mongoose'); 
const bcrypt = require('bcryptjs'); // <--- 
const bcrypt = require('bcryptjs'); // <--- Agar ye missing hai toh bhi crash hoga
const bcrypt = require('bcryptjs'); // Zaroori: Password hashing ke liye

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

// Pre-save middleware (Password Hash and Referral Code Set)
userSchema.pre('save', async function (next) {
    // Agar password modify nahi hua hai, toh next chala do
    if (!this.isModified('password')) {
        return next();
    }
    
    // Password hash
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Set myReferralCode to phone number if it's new
    if (this.isNew) {
        this.myReferralCode = this.phoneNumber;
    }
    next();
});

// Final line to export the model
const User = mongoose.model('User', userSchema);
module.exports = User;

