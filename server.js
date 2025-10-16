const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const fs = require('fs'); // <--- Zaroori hai index.html check karne ke liye

// Environment variables ko .env file se load karein (local development ke liye)
// Vercel par process.env variables use hote hain, .env file ignore hoti hai.
// isliye, Vercel par yeh line koi asar nahi karegi.
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware Setup
// ============================================
app.use(cors()); // CORS enable kiya
app.use(express.json()); // JSON request bodies ko parse karne ke liye
app.use(express.urlencoded({ extended: true }));

// ============================================
// MongoDB Connection
// ============================================
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // Note: useCreateIndex and useFindAndModify are deprecated and removed in Mongoose 6+
})
.then(() => console.log('MongoDB Connected Successfully!'))
.catch(err => console.error('MongoDB Connection Error:', err));

// ============================================
// Static Files Serving
// ============================================
// Static files (CSS, JS, images, index.html) ko serve karne ke liye.
// Vercel par __dirname ki jagah process.cwd() use kiya hai.
app.use(express.static(path.join(process.cwd())));

// ============================================
// Import & Use Routes
// ============================================
const mkrRoutes = require('./mkr'); // <--- Routes ko root folder se import kiya
app.use('/api', mkrRoutes); // Sabhi routes ko '/api' prefix par mount kiya

// ============================================
// Serve Frontend (index.html) - Final Fix for Vercel Crash
// ============================================
// Root URL ('/') par seedhe index.html ko serve karein.
app.get('/', (req, res) => {
    // Vercel environment mein path resolve karne ka safe tareeka
    const filePath = path.join(process.cwd(), 'index.html');
    
    // Crash se bachne ke liye file ki availability check karein
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        // Agar file nahi mili, toh server crash nahi hoga, bas yeh message dega
        res.status(404).send("MKR Earning Website: Index.html not found.");
    }
});

// ============================================
// Server Listen (Vercel par yeh run nahi hota)
// ============================================
// Yeh block Vercel deployment ke liye zaroori nahi hai,
// lekin local testing ke liye accha hai.
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(Server is running on port ${PORT});
    });
}

// Vercel serverless function ko export karein
module.exports = app;
