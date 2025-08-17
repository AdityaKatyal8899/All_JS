import fetch from 'node-fetch';
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

// ===== Spotify OAuth Setup =====
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI; // e.g., https://yourdomain.com/spotify-callback

// ===== MongoDB Setup =====
const MONGO_URI = process.env.MONGODB_URI;
const client = new MongoClient(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let usersGoogle, usersSpoti;

client.connect()
  .then(() => {
    console.log("✅ Connected to MongoDB");
    const db = client.db("AuthTest");     
    usersGoogle = db.collection("GoogleLogs");    
    usersSpoti = db.collection("SpotifyLogs");    
    return Promise.all([usersGoogle.indexes(), usersSpoti.indexes()]);
  })
  .then(([googleIndexes, spotifyIndexes]) => {
    console.log("MongoDB indexes on GoogleLogs:", googleIndexes);   
    console.log("MongoDB indexes on SpotifyLogs:", spotifyIndexes); 
  })
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ===== Middleware =====
app.use(express.static('public'));
app.use(express.json());

// ===== Routes =====

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== Google OAuth =====
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

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect('/?error=no_code');
  if (!usersGoogle) return res.redirect('/?error=db_not_ready');

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const userData = {
      googleId: userInfo.data.id,
      name: userInfo.data.name,
      email: userInfo.data.email,
      picture: userInfo.data.picture,
      tokens,
      lastLogin: new Date()
    };

    console.log("Received Google user data:", userData);

    await usersGoogle.updateOne(
      { email: userData.email },
      {
        $set: {
          name: userData.name,
          picture: userData.picture,
          lastLogin: new Date()
        },
        $setOnInsert: {
          googleId: userData.googleId,
          tokens: userData.tokens,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    res.redirect(`/success?user=${encodeURIComponent(JSON.stringify({
      googleId: userData.googleId,
      name: userData.name,
      picture: userData.picture,
      email: userData.email
    }))}`);

  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect('/?error=oauth_failed');
  }
});

// ===== Spotify OAuth =====
app.get('/auth/spotify', (req, res) => {
  const scopes = [
    'user-read-private',
    'user-read-email'
  ];

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: scopes.join(' ')
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

app.get('/spotify-callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect('/?error=no_code');
  if (!usersSpoti) return res.redirect('/?error=db_not_ready');

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI
      })
    });

    const tokenData = await tokenRes.json();
    const access_token = tokenData.access_token;

    // Fetch user profile
    const userRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    const userInfo = await userRes.json();

    const userData = {
      spotifyId: userInfo.id,
      name: userInfo.display_name,
      email: userInfo.email,
      picture: userInfo.images[0]?.url || null,
      tokens: tokenData,
      lastLogin: new Date()
    };

    console.log("Received Spotify user data:", userData);

    await usersSpoti.updateOne(
      { email: userData.email },
      {
        $set: {
          name: userData.name,
          picture: userData.picture,
          lastLogin: new Date()
        },
        $setOnInsert: {
          spotifyId: userData.spotifyId,
          tokens: userData.tokens,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    res.redirect(`/success?user=${encodeURIComponent(JSON.stringify({
      spotifyId: userData.spotifyId,
      name: userData.name,
      picture: userData.picture,
      email: userData.email
    }))}`);

  } catch (err) {
    console.error('Spotify OAuth error:', err);
    res.redirect('/?error=oauth_failed');
  }
});

// ===== Success page =====
app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

// ===== Start Server =====
app.listen(PORT, () => {
  try{
    console.log("✅Connection Successfull")
  console.log(`🚀 Server running at http://localhost:${PORT}`);}

  catch(err){
    console.log("❌Unable to connect to the server!")
  }
});
