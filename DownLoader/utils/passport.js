const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

function setupGoogleStrategy() {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        // Update existing user's tokens
        await user.updateTokens(accessToken, refreshToken, 3600); // 1 hour default
        return done(null, user);
      }
      
      // Create new user
      user = new User({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        profilePicture: profile.photos[0]?.value,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600,
          tokenExpiry: new Date(Date.now() + 3600 * 1000)
        }
      });
      
      await user.save();
      return done(null, user);
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, null);
    }
  }));

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}

module.exports = {
  setupGoogleStrategy
};
