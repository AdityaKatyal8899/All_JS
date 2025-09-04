const express = require('express');
const router = express.Router();
const { processDownload } = require('../utils/helpers');
const Download = require('../models/Download');

// Auth middleware
function isAuthenticated(req, res, next) {
  if(req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

// Start a download
router.post('/download', isAuthenticated, async (req, res) => {
  const { url, type, format_id } = req.body;
  if(!url || !type) return res.status(400).json({ error: 'URL and type required' });

  try {
    const download = await Download.create({
      userId: req.user._id,
      fileName: `download-${Date.now()}`,
      originalFileName: 'pending',
      fileType: type,
      status: 'pending',
      youtubeUrl: url
    });

    processDownload(download, url, type, format_id); // background process

    res.json({ id: download._id, status: 'pending', message: 'Download started' });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start download' });
  }
});

// Get user downloads
router.get('/downloads', isAuthenticated, async (req, res) => {
  const downloads = await Download.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json(downloads);
});

module.exports = router;
