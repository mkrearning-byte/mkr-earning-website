const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User =require('./user');

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
router.post

