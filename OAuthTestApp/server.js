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
    const db = client.db("authDemo"); // <-- Your DB name
    usersCollection = db.collection("SignUps");
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
    prompt: 'consent'
  });

  res.redirect(authUrl);
});

// Handle OAuth callback
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect('/?error=no_code');

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const userData = {
      googleId: userInfo.data.sub,
      name: userInfo.data.name,
      picture: userInfo.data.picture
    };

    if (usersCollection) {
      const existingUser = await usersCollection.findOne({ googleId: userData.googleId });
      if (!existingUser) {
        await usersCollection.insertOne(userData);
        console.log("✅ New user added to DB");
      } else {
        console.log("ℹ️ User already exists in DB");
      }
    }

    res.redirect(`/success?user=${encodeURIComponent(JSON.stringify(userData))}`);
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
