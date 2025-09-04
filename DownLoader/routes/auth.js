const express = require('express');
const passport = require('passport');
const router = express.Router();

// Google login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: '/',
  successRedirect: '/dashboard'
}));

// Logout
router.get('/logout', (req, res) => {
  req.logout(err => {
    if(err) return res.status(500).json({ error: 'Logout failed' });
    res.redirect('/');
  });
});

// Auth status
router.get('/status', (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({ authenticated: true, user: req.user });
  }
  res.json({ authenticated: false });
});

module.exports = router;
