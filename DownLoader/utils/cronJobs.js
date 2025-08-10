const cron = require('node-cron');
const fs = require('fs-extra');
const path = require('path');
const Download = require('../models/Download');
const User = require('../models/User');
const axios = require('axios');

function setupCronJobs() {
  // Clean up expired files every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running file cleanup job...');
    try {
      const expiredDownloads = await Download.find({
        expiresAt: { $lt: new Date() },
        status: 'completed'
      });

      const downloadsPath = process.env.DOWNLOAD_PATH || './downloads';
      
      for (const download of expiredDownloads) {
        try {
          // Delete file from filesystem
          const filePath = path.join(downloadsPath, download.fileName);
          await fs.remove(filePath);
          
          // Update status in database
          download.status = 'expired';
          await download.save();
          
          console.log(`Deleted expired file: ${download.fileName}`);
        } catch (error) {
          console.error(`Error deleting file ${download.fileName}:`, error);
        }
      }
      
      console.log(`File cleanup completed. Deleted ${expiredDownloads.length} files.`);
    } catch (error) {
      console.error('File cleanup job error:', error);
    }
  });

  // Refresh expired tokens every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('Running token refresh job...');
    try {
      const usersWithExpiredTokens = await User.find({
        'tokens.tokenExpiry': { $lt: new Date() }
      });

      for (const user of usersWithExpiredTokens) {
        try {
          await refreshUserToken(user);
          console.log(`Refreshed token for user: ${user.email}`);
        } catch (error) {
          console.error(`Error refreshing token for user ${user.email}:`, error);
        }
      }
      
      console.log(`Token refresh completed. Processed ${usersWithExpiredTokens.length} users.`);
    } catch (error) {
      console.error('Token refresh job error:', error);
    }
  });

  // Clean up failed downloads older than 1 hour
  cron.schedule('0 */2 * * *', async () => {
    console.log('Running failed downloads cleanup...');
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const failedDownloads = await Download.find({
        status: 'failed',
        createdAt: { $lt: oneHourAgo }
      });

      for (const download of failedDownloads) {
        try {
          // Delete file if it exists
          const downloadsPath = process.env.DOWNLOAD_PATH || './downloads';
          const filePath = path.join(downloadsPath, download.fileName);
          await fs.remove(filePath);
          
          // Remove from database
          await download.remove();
          
          console.log(`Cleaned up failed download: ${download.fileName}`);
        } catch (error) {
          console.error(`Error cleaning up failed download ${download.fileName}:`, error);
        }
      }
      
      console.log(`Failed downloads cleanup completed. Removed ${failedDownloads.length} entries.`);
    } catch (error) {
      console.error('Failed downloads cleanup error:', error);
    }
  });
}

async function refreshUserToken(user) {
  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: user.tokens.refreshToken,
      grant_type: 'refresh_token'
    });

    const { access_token, expires_in } = response.data;
    
    await user.updateTokens(
      access_token,
      user.tokens.refreshToken, // Keep the same refresh token
      expires_in
    );
    
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  setupCronJobs,
  refreshUserToken
};
