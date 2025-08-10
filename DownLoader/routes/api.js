const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const router = express.Router();

// Import models
const User = require('../models/User');
const Download = require('../models/Download');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const downloadsPath = process.env.DOWNLOAD_PATH || './downloads';
    cb(null, downloadsPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Get user profile
router.get('/user', isAuthenticated, (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    profilePicture: req.user.profilePicture,
    createdAt: req.user.createdAt
  });
});

// Get user's downloads
router.get('/downloads', isAuthenticated, async (req, res) => {
  try {
    const downloads = await Download.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(downloads.map(download => ({
      id: download._id,
      fileName: download.fileName,
      originalFileName: download.originalFileName,
      fileType: download.fileType,
      fileSize: download.getFileSizeFormatted(),
      youtubeUrl: download.youtubeUrl,
      youtubeTitle: download.youtubeTitle,
      youtubeThumbnail: download.youtubeThumbnail,
      status: download.status,
      error: download.error,
      expiresAt: download.expiresAt,
      downloadedAt: download.downloadedAt,
      isExpired: download.isExpired()
    })));
  } catch (error) {
    console.error('Error fetching downloads:', error);
    res.status(500).json({ error: 'Failed to fetch downloads' });
  }
});

// Get available formats for a URL
router.post('/formats', isAuthenticated, async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  try {
    const flaskApiUrl = process.env.FLASK_API_URL || 'http://localhost:5001';
    const response = await axios.post(`${flaskApiUrl}/api/formats`, { url });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error getting formats:', error);
    res.status(500).json({ error: 'Failed to get formats' });
  }
});

// Start download process
router.post('/download', isAuthenticated, async (req, res) => {
  const { url, type, format_id } = req.body;
  
  if (!url || !type) {
    return res.status(400).json({ error: 'URL and type are required' });
  }
  
  if (!['video', 'audio', 'short', 'reel'].includes(type)) {
    return res.status(400).json({ error: 'Type must be video, audio, short, or reel' });
  }
  
  if (type === 'video' && !format_id) {
    return res.status(400).json({ error: 'format_id is required for video downloads' });
  }
  
  try {
    // Create download record
    const download = new Download({
      userId: req.user._id,
      fileName: `download-${Date.now()}`,
      originalFileName: 'pending',
      fileType: type,
      filePath: '',
      youtubeUrl: url,
      status: 'pending'
    });
    
    await download.save();
    
    // Start download process in background
    processDownload(download, url, type, format_id);
    
    res.json({
      id: download._id,
      status: 'pending',
      message: 'Download started'
    });
  } catch (error) {
    console.error('Error starting download:', error);
    res.status(500).json({ error: 'Failed to start download' });
  }
});

// Get download status
router.get('/download/:id', isAuthenticated, async (req, res) => {
  try {
    const download = await Download.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!download) {
      return res.status(404).json({ error: 'Download not found' });
    }
    
    res.json({
      id: download._id,
      fileName: download.fileName,
      originalFileName: download.originalFileName,
      fileType: download.fileType,
      fileSize: download.getFileSizeFormatted(),
      youtubeUrl: download.youtubeUrl,
      youtubeTitle: download.youtubeTitle,
      youtubeThumbnail: download.youtubeThumbnail,
      status: download.status,
      error: download.error,
      expiresAt: download.expiresAt,
      downloadedAt: download.downloadedAt,
      isExpired: download.isExpired()
    });
  } catch (error) {
    console.error('Error fetching download:', error);
    res.status(500).json({ error: 'Failed to fetch download' });
  }
});

// Download file
router.get('/download/:id/file', isAuthenticated, async (req, res) => {
  try {
    const download = await Download.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!download) {
      return res.status(404).json({ error: 'Download not found' });
    }
    
    if (download.status !== 'completed') {
      return res.status(400).json({ error: 'Download not completed' });
    }
    
    if (download.isExpired()) {
      return res.status(410).json({ error: 'File has expired' });
    }
    
    const downloadsPath = process.env.DOWNLOAD_PATH || './downloads';
    const filePath = path.join(downloadsPath, download.fileName);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(filePath, download.originalFileName);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Delete download
router.delete('/download/:id', isAuthenticated, async (req, res) => {
  try {
    const download = await Download.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!download) {
      return res.status(404).json({ error: 'Download not found' });
    }
    
    // Delete file if it exists
    const downloadsPath = process.env.DOWNLOAD_PATH || './downloads';
    const filePath = path.join(downloadsPath, download.fileName);
    await fs.remove(filePath);
    
    // Remove from database
    await download.remove();
    
    res.json({ message: 'Download deleted successfully' });
  } catch (error) {
    console.error('Error deleting download:', error);
    res.status(500).json({ error: 'Failed to delete download' });
  }
});

// Process download using Flask API
async function processDownload(download, url, type, format_id) {
  try {
    // Update status to processing
    download.status = 'processing';
    await download.save();
    
    const flaskApiUrl = process.env.FLASK_API_URL || 'http://localhost:5001';
    let response;
    
    // Call appropriate Flask API endpoint based on type
    switch (type) {
      case 'video':
        response = await axios.post(`${flaskApiUrl}/api/download/video`, {
          url: url,
          format_id: format_id
        });
        break;
      case 'audio':
        response = await axios.post(`${flaskApiUrl}/api/download/audio`, {
          url: url
        });
        break;
      case 'short':
        response = await axios.post(`${flaskApiUrl}/api/download/short`, {
          url: url
        });
        break;
      case 'reel':
        response = await axios.post(`${flaskApiUrl}/api/download/reel`, {
          url: url
        });
        break;
      default:
        throw new Error('Invalid download type');
    }
    
    if (response.data.success) {
      // Update download record with file info
      const fileInfo = response.data.files[0]; // Get first file
      download.status = 'completed';
      download.fileName = fileInfo.filename;
      download.originalFileName = response.data.title;
      download.filePath = fileInfo.filepath;
      download.fileSize = fileInfo.filesize;
      download.youtubeTitle = response.data.title;
      download.youtubeThumbnail = response.data.thumbnail;
      await download.save();
      
      console.log(`Download completed: ${download.fileName}`);
    } else {
      download.status = 'failed';
      download.error = response.data.error || 'Download failed';
      await download.save();
    }
    
  } catch (error) {
    console.error('Error processing download:', error);
    download.status = 'failed';
    download.error = error.response?.data?.error || error.message;
    await download.save();
  }
}

module.exports = router;
