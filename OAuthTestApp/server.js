const express = require('express');
const { google } = require('googleapis');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Google OAuth2 Setup =====
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// ===== MongoDB Setup =====
const MONGO_URI = process.env.MONGODB_URI;
const client = new MongoClient(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let usersCollection;

client.connect()
  .then(() => {
    console.log("✅ Connected to MongoDB");
    const db = client.db("logtest"); // Your DB name
    usersCollection = db.collection("logs"); //Your Collection name

    // Optional: show indexes to verify unique constraints
    return usersCollection.indexes();
  })
  .then(indexes => {
    console.log("MongoDB indexes on SignUps collection:", indexes);
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
  });

// ===== Middleware =====
app.use(express.static('public'));
app.use(express.json());

// ===== Routes =====

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initiate Google OAuth login
app.get('/auth/google', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent' // Always ask for consent to get refresh token on first login
  });

  res.redirect(authUrl);
});

// Handle OAuth callback
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    console.warn("OAuth callback missing code");
    return res.redirect('/?error=no_code');
  }

  if (!usersCollection) {
    console.error("Users collection not initialized!");
    return res.redirect('/?error=db_not_ready');
  }

  // Create a new OAuth2 client instance
  const oauth2ClientInstance = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2ClientInstance.getToken(code);
    oauth2ClientInstance.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2ClientInstance });
    const userInfo = await oauth2.userinfo.get();

    const userData = {
      googleId: userInfo.data.sub,
      name: userInfo.data.name,
      email: userInfo.data.email,
      picture: userInfo.data.picture,
      tokens,            // Optional: be careful with security if you store tokens
      lastLogin: new Date()
    };

    console.log("Received user data from Google:", userData);

    await usersCollection.updateOne(
  { googleId: userData.googleId },
  {
    $setOnInsert: {
      name: userData.name,
      email: userData.email,
      picture: userData.picture,
      tokens: userData.tokens,
      createdAt: new Date()
    },
    $set: {
      lastLogin: new Date()
    }
  },
  { upsert: true }
);


    // Redirect to success page with safe user data (no tokens)
    res.redirect(`/success?user=${encodeURIComponent(JSON.stringify({
      googleId: userData.googleId,
      name: userData.name,
      picture: userData.picture,
      email: userData.email
    }))}`);

  } catch (error) {
    console.error('OAuth error:', error);
    res.redirect('/?error=oauth_failed');
  }
});


// Success page
app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
