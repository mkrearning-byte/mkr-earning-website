// server.js - Node.js Server Engine
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes (important for frontend testing)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS) - FIX for Vercel
// Vercel par __dirname ki jagah process.cwd() use karein
app.use(express.static(path.join(process.cwd(), ''))); // <-- Root folder ko static serve kiya

// === MongoDB Connection ===
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true, // Deprecated in Mongoose 6+
    useUnifiedTopology: true, // Deprecated in Mongoose 6+
    // Note: useCreateIndex and useFindAndModify are deprecated and removed in Mongoose 6+
})
.then(() => console.log('MongoDB Connected Successfully!'))
.catch(err => console.error('MongoDB Connection Error:', err));


// === Import Routes ===
const mkrRoutes = require('./mkr'); // <--- PATH FIXED: mkr.js ko root se import kiya
// --------------------

// === Use Routes ===
app.use('/api', mkrRoutes);
// ------------------


// === Serve Frontend (index.html) ===
// Frontend file ko static folder se serve karein, ya seedhe index.html ko root par serve karein
app.get('/', (req, res) => {
    // FIX for Vercel: process.cwd() is used to resolve the file path correctly
    res.sendFile(path.join(process.cwd(), 'index.html'));
});
// -----------------------------------


// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Global Error Handling Middleware (agar koi unhandled error aaye)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});


// Server Listening
const PORT = process.env.PORT || 8080; // Vercel apne aap PORT provide karega
app.listen(PORT, () => console.log(`Server running on port ${PORT}!`));
