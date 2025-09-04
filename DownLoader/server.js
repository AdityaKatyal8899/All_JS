require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs-extra');

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const { setupGoogleStrategy } = require('./utils/passport');
const { setupCronJobs } = require('./utils/cronJobs');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure downloads folder exists
const downloadsPath = process.env.DOWNLOAD_PATH || './downloads';
fs.ensureDirSync(downloadsPath);

// Public path
const publicPath = path.join(__dirname, '../public');

// Helmet security with CSP allowing inline scripts
app.use(
    helmet({
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "data:"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
    })
);

// CORS
app.use(
    cors({
        origin: process.env.NODE_ENV === 'production' ? false : true,
        credentials: true,
    })
);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(publicPath));

// Session setup
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            collectionName: 'sessions',
        }),
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        },
    })
);

// Passport setup
app.use(passport.initialize());
app.use(passport.session());
setupGoogleStrategy();

// Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// HTML routes
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'), err => {
        if (err) console.error('Error sending index.html:', err);
    });
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(publicPath, 'dashboard.html'), err => {
        if (err) console.error('Error sending dashboard.html:', err);
    });
});

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Connect to MongoDB and start server
mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('✅ Connected to MongoDB');
        setupCronJobs();
        app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

module.exports = app;
