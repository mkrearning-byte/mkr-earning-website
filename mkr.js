const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./user'); // <--- Sahi path, kyunki user.js root folder mein hai

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

    // JWT_SECRET environment variable Vercel settings mein hona chahiye
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
  
  // Agar last watch date aaj ki nahi hai, toh counter reset kar do
  if (lastWatchDate !== today) {
    user.totalAdsWatchedToday = 0;
    user.lastAdWatchDate = new Date(); // Update the date
  }
};

// ============================================
// ROUTE 1: Signup
// ============================================
router.post('/signup', async (req, res) => {
    try {
        const { phoneNumber, password, referredBy } = req.body;
        
        // 1. Validation (Optional, lekin best practice hai)
        if (!phoneNumber || !password) {
             return res.status(400).json({ success: false, message: 'Phone number and password are required' });
        }
        
        // 2. Check if user already exists
        let user = await User.findOne({ phoneNumber });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        
        // 3. Create new user (password hashing is done in user.js pre-save hook)
        user = new User({ phoneNumber, password, referredBy });
        await user.save();

        // 4. Send success response
        res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ success: false, message: 'Server error during signup' });
    }
});

// ============================================
// ROUTE 2: Login
// ============================================
router.post('/login', async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;

        // 1. Check if user exists
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // 2. Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // 3. Generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' }); // Token for 1 day

        // 4. Send success response with token
        res.json({ success: true, token, message: 'Login successful' });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

// ============================================
// ROUTE 3: Get User Profile (Requires Auth)
// ============================================
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password'); // Password exclude kiya

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Daily ad count ko reset/update karein
        resetDailyAdCount(user);
        await user.save(); // Changes save kiye

        // User data bhejein
        res.json({ 
            success: true, 
            data: {
                phoneNumber: user.phoneNumber,
                coins: user.coins,
                myReferralCode: user.myReferralCode,
                totalAdsWatchedToday: user.totalAdsWatchedToday,
                totalEarningsAllTime: user.totalEarningsAllTime,
                totalReferrals: user.totalReferrals,
                // ... aur data jo aapko dashboard par chahiye
            }
        });

    } catch (error) {
        console.error("Profile Error:", error);
        res.status(500).json({ success: false, message: 'Server error fetching profile' });
    }
});


// ============================================
// ROUTE 4: Watch Ad and Update Coins (Requires Auth)
// NOTE: Is route mein ads aur coin logic ko implement karna hoga
// ============================================
router.post('/watch-ad', authMiddleware, async (req, res) => {
    // Assuming 5 coins per ad
    const COINS_PER_AD = 5;
    const MAX_ADS_PER_DAY = 50; 

    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // 1. Reset check (zarurat nahi, kyunki profile route mein hota hai, lekin safe side ke liye)
        resetDailyAdCount(user);

        // 2. Max ads check
        if (user.totalAdsWatchedToday >= MAX_ADS_PER_DAY) {
            await user.save(); 
            return res.status(400).json({ 
                success: false, 
                message: You have reached the daily limit of ${MAX_ADS_PER_DAY} ads. 
            });
        }

        // 3. Update counts and coins
        user.totalAdsWatchedToday += 1;
        user.totalAdsWatchedAllTime += 1;
        user.coins += COINS_PER_AD;
        user.totalEarningsAllTime += COINS_PER_AD; // Coins ko earning mein add kiya

        // 4. Referral bonus logic (optional, aap isko baad mein add kar sakte hain)
        // ... (Referral bonus logic yahan aayega)

        await user.save();

        res.json({ 
            success: true, 
            message: 'Ad watched successfully. Coins updated.', 
            newCoins: user.coins,
            adsRemaining: MAX_ADS_PER_DAY - user.totalAdsWatchedToday
        });

    } catch (error) {
        console.error("Watch Ad Error:", error);
        res.status(500).json({ success: false, message: 'Server error updating coins' });
    }
});


// ============================================
// ROUTE 5: Redeem Request (Requires Auth)
// NOTE: Is route mein cashout logic ko implement karna hoga
// ============================================
router.post('/redeem', authMiddleware, async (req, res) => {
    const { amount, paymentDetails } = req.body; 
    
    // Redeem amounts aur corresponding coins (example values)
    const REDEEM_OPTIONS = {
        100: { coins: 1000, maxCount: 2, countField: 'redeem100Count', completedField: 'redeem100Completed' },
        200: { coins: 2000, maxCount: 1, countField: 'redeem200Count', completedField: 'redeem200Completed' },
        300: { coins: 3000, maxCount: 1, countField: 'redeem300Count', completedField: 'redeem300Completed' }
    };
    
    if (!REDEEM_OPTIONS[amount]) {
        return res.status(400).json({ success: false, message: 'Invalid redeem amount.' });
    }
    
    const option = REDEEM_OPTIONS[amount];

    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // 1. Coin check
        if (user.coins < option.coins) {
            return res.status(400).json({ success: false, message: You need ${option.coins} coins to redeem ₹${amount}. });
        }

        // 2. Limit check
        if (user[option.countField] >= option.maxCount) {
             return res.status(400).json({ success: false, message: You have reached the limit for ₹${amount} redemption. });
        }

        // 3. Process Redemption
        user.coins -= option.coins;
        user[option.countField] += 1; // Limit count badhaya
        user.redeemHistory.push({ 
            amount: amount, 
            coins: option.coins, 
            status: 'pending' // Admin isko baad mein change karega
        });

        await user.save();

        res.json({ 
            success: true, 
            message: Redemption request for ₹${amount} successful. Your request is pending., 
            newCoins: user.coins
        });

    } catch (error) {
        console.error("Redeem Error:", error);
        res.status(500).json({ success: false, message: 'Server error processing redemption' });
    }
});


module.exports = router;
