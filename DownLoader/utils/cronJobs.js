const fs = require('fs-extra');
const path = require('path');
const Download = require('../models/Download');

function setupCronJobs() {
  // Example: cleanup expired downloads every hour
  setInterval(async () => {
    const expired = await Download.find({ expiresAt: { $lt: new Date() } });
    const downloadsPath = process.env.DOWNLOAD_PATH || './downloads';
    for (let file of expired) {
      const filePath = path.join(downloadsPath, file.fileName);
      await fs.remove(filePath);
      await file.remove();
    }
    console.log(`🧹 Cleaned ${expired.length} expired files`);
  }, 60 * 60 * 1000);
}

module.exports = { setupCronJobs };
