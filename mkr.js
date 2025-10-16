const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./user'); // <--- PATH FIXED: user.js ko root se import kar raha hai

const router = express.Router();

// ============================================
// JWT Authentication Middleware
// ============================================
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication token not provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

// ============================================
// Helper Function: Reset Daily Ad Count
// ============================================
const resetDailyAdCount = (user) => {
  const today = new Date().toDateString();
  const lastWatchDate = user.lastAdWatchDate 
    ? new Date(user.lastAdWatchDate).toDateString() 
    : null;
  
  // If last watch date is not today, reset counter
  if (lastWatchDate !== today) {
    user.totalAdsWatchedToday = 0;
    user.lastAdWatchDate = new Date();
  }
};

// ============================================
// ROUTE 1: Signup
// ============================================
router.post('/signup', async (req, res) => {
    // Yahan signup ka poora code aayega. 
    // Example:
    try {
        const { phoneNumber, password, referredBy } = req.body;
        
        // 1. Check if user already exists
        let user = await User.findOne({ phoneNumber });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        
        // 2. Create new user (password hashing is done in user.js pre-save hook)
        user = new User({ phoneNumber, password, referredBy });
        await user.save();

        // 3. Send success response
        res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error during signup' });
    }
});
// ********************************************
// NOTE: Iske neeche aur baaki routes ka code bhi daal dein.
// ********************************************

module.exports = router;
