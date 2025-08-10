// Dashboard JavaScript
let currentUser = null;
let activeDownloads = new Map();
let downloadPollingIntervals = new Map();

document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initializeDashboard();
    
    // Setup event listeners
    setupEventListeners();
});

// Initialize dashboard
async function initializeDashboard() {
    try {
        // Load user info
        await loadUserInfo();
        
        // Load downloads
        await loadDownloads();
        
        // Start polling for active downloads
        startDownloadPolling();
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

// Load user information
async function loadUserInfo() {
    try {
        const response = await fetch('/api/user', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load user info');
        }
        
        currentUser = await response.json();
        
        // Update UI
        document.getElementById('userName').textContent = currentUser.name;
        
        if (currentUser.profilePicture) {
            document.getElementById('userAvatar').src = currentUser.profilePicture;
        } else {
            // Use default avatar
            document.getElementById('userAvatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=667eea&color=fff&size=40`;
        }
        
    } catch (error) {
        console.error('Error loading user info:', error);
        // Redirect to login if not authenticated
        if (error.message.includes('401')) {
            window.location.href = '/';
        }
    }
}

// Load downloads
async function loadDownloads() {
    try {
        const response = await fetch('/api/downloads', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load downloads');
        }
        
        const downloads = await response.json();
        
        // Update active downloads
        updateActiveDownloads(downloads.filter(d => ['pending', 'processing'].includes(d.status)));
        
        // Update download history
        updateDownloadHistory(downloads.filter(d => ['completed', 'failed', 'expired'].includes(d.status)));
        
    } catch (error) {
        console.error('Error loading downloads:', error);
        showNotification('Failed to load downloads', 'error');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Download form
    const downloadForm = document.getElementById('downloadForm');
    downloadForm.addEventListener('submit', handleDownloadSubmit);
    
    // Format buttons
    const formatButtons = document.querySelectorAll('.format-btn');
    formatButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            formatButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Show/hide format selection for video downloads
            const formatSelection = document.getElementById('formatSelection');
            if (this.dataset.format === 'video') {
                formatSelection.style.display = 'block';
            } else {
                formatSelection.style.display = 'none';
            }
        });
    });
    
    // URL input for format detection
    const urlInput = document.getElementById('youtubeUrl');
    let formatCheckTimeout;
    urlInput.addEventListener('input', function() {
        clearTimeout(formatCheckTimeout);
        const url = this.value.trim();
        
        if (url && url.includes('youtube.com')) {
            formatCheckTimeout = setTimeout(() => {
                checkAvailableFormats(url);
            }, 1000);
        }
    });
}

// Check available formats for a URL
async function checkAvailableFormats(url) {
    try {
        const response = await fetch('/api/formats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ url })
        });
        
        if (!response.ok) {
            throw new Error('Failed to get formats');
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayFormatOptions(data.formats, data.video_info);
        }
    } catch (error) {
        console.error('Error checking formats:', error);
    }
}

// Display format options
function displayFormatOptions(formats, videoInfo) {
    const formatOptions = document.getElementById('formatOptions');
    const formatSelection = document.getElementById('formatSelection');
    
    let html = '';
    
    // Video + Audio formats
    if (formats.video_audio && formats.video_audio.length > 0) {
        html += '<div class="format-group">';
        html += '<h5>Video + Audio (Recommended)</h5>';
        formats.video_audio.forEach(format => {
            html += `
                <label class="format-option">
                    <input type="radio" name="format_id" value="${format.id}">
                    <span class="format-info">
                        <span class="format-res">${format.res}</span>
                        <span class="format-ext">${format.ext.toUpperCase()}</span>
                        <span class="format-size">${format.size_str}</span>
                    </span>
                </label>
            `;
        });
        html += '</div>';
    }
    
    // Audio only formats
    if (formats.audio_only && formats.audio_only.length > 0) {
        html += '<div class="format-group">';
        html += '<h5>Audio Only</h5>';
        formats.audio_only.forEach(format => {
            html += `
                <label class="format-option">
                    <input type="radio" name="format_id" value="${format.id}">
                    <span class="format-info">
                        <span class="format-res">${format.format_note}</span>
                        <span class="format-ext">${format.ext.toUpperCase()}</span>
                        <span class="format-size">${format.size_str}</span>
                    </span>
                </label>
            `;
        });
        html += '</div>';
    }
    
    formatOptions.innerHTML = html;
    
    // Auto-select first option
    const firstOption = formatOptions.querySelector('input[type="radio"]');
    if (firstOption) {
        firstOption.checked = true;
    }
}

// Handle download form submission
async function handleDownloadSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const urlInput = document.getElementById('youtubeUrl');
    const formatButtons = document.querySelectorAll('.format-btn');
    const submitBtn = form.querySelector('.download-btn');
    
    const url = urlInput.value.trim();
    const activeFormat = document.querySelector('.format-btn.active');
    const type = activeFormat.dataset.format;
    
    if (!url) {
        showNotification('Please enter a URL', 'error');
        return;
    }
    
    if (!type) {
        showNotification('Please select a format', 'error');
        return;
    }
    
    // Get format_id for video downloads
    let format_id = null;
    if (type === 'video') {
        const selectedFormat = document.querySelector('input[name="format_id"]:checked');
        if (!selectedFormat) {
            showNotification('Please select a video quality', 'error');
            return;
        }
        format_id = selectedFormat.value;
    }
    
    try {
        // Show loading state
        setButtonLoading(submitBtn, true);
        
        // Submit download request
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ url, type, format_id })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to start download');
        }
        
        const result = await response.json();
        
        // Add to active downloads
        activeDownloads.set(result.id, {
            id: result.id,
            status: result.status,
            url: url,
            type: type,
            startTime: new Date()
        });
        
        // Update UI
        updateActiveDownloads(Array.from(activeDownloads.values()));
        
        // Start polling for this download
        startPollingDownload(result.id);
        
        // Clear form
        urlInput.value = '';
        document.getElementById('formatSelection').style.display = 'none';
        
        showNotification('Download started successfully!', 'success');
        
    } catch (error) {
        console.error('Error starting download:', error);
        showNotification(error.message, 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

// Update active downloads section
function updateActiveDownloads(downloads) {
    const container = document.getElementById('activeDownloads');
    
    if (downloads.length === 0) {
        container.innerHTML = '<p class="no-downloads">No active downloads</p>';
        return;
    }
    
    container.innerHTML = downloads.map(download => `
        <div class="download-item" data-id="${download.id}">
            <div class="download-info">
                <div class="download-title">${download.url}</div>
                <div class="download-meta">
                    <span class="download-type">${download.type.toUpperCase()}</span>
                    <span class="download-time">${formatTime(download.startTime)}</span>
                </div>
            </div>
            <div class="download-status status-${download.status}">
                ${download.status.charAt(0).toUpperCase() + download.status.slice(1)}
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${download.status === 'processing' ? '50%' : '25%'}"></div>
            </div>
        </div>
    `).join('');
}

// Update download history section
function updateDownloadHistory(downloads) {
    const container = document.getElementById('downloadHistory');
    
    if (downloads.length === 0) {
        container.innerHTML = '<p class="no-downloads">No download history</p>';
        return;
    }
    
    container.innerHTML = downloads.map(download => `
        <div class="download-card-history" data-id="${download.id}">
            ${download.youtubeThumbnail ? 
                `<img src="${download.youtubeThumbnail}" alt="Thumbnail" class="download-thumbnail">` : 
                `<div class="download-thumbnail-placeholder">
                    <i class="fas fa-${download.fileType === 'video' ? 'video' : 'music'}"></i>
                </div>`
            }
            <div class="download-title">${download.youtubeTitle || 'Unknown Title'}</div>
            <div class="download-meta">
                <span class="download-type">${download.fileType.toUpperCase()}</span>
                <span class="download-size">${download.fileSize}</span>
            </div>
            <div class="download-actions">
                ${download.status === 'completed' && !download.isExpired ? 
                    `<button class="action-btn download-file-btn" onclick="downloadFile('${download.id}')">
                        <i class="fas fa-download"></i>
                        Download
                    </button>` : 
                    `<span class="download-status status-${download.status}">
                        ${download.status.charAt(0).toUpperCase() + download.status.slice(1)}
                    </span>`
                }
                <button class="action-btn delete-btn" onclick="deleteDownload('${download.id}')">
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Start polling for download status
function startPollingDownload(downloadId) {
    // Clear existing interval if any
    if (downloadPollingIntervals.has(downloadId)) {
        clearInterval(downloadPollingIntervals.get(downloadId));
    }
    
    const interval = setInterval(async () => {
        try {
            const response = await fetch(`/api/download/${downloadId}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch download status');
            }
            
            const download = await response.json();
            
            // Update active downloads
            if (['pending', 'processing'].includes(download.status)) {
                activeDownloads.set(downloadId, {
                    id: downloadId,
                    status: download.status,
                    url: download.youtubeUrl,
                    type: download.fileType,
                    startTime: new Date(download.downloadedAt)
                });
            } else {
                // Download completed or failed
                activeDownloads.delete(downloadId);
                clearInterval(interval);
                downloadPollingIntervals.delete(downloadId);
                
                // Reload all downloads to update history
                await loadDownloads();
                
                if (download.status === 'completed') {
                    showNotification('Download completed successfully!', 'success');
                } else if (download.status === 'failed') {
                    showNotification(`Download failed: ${download.error}`, 'error');
                }
            }
            
            updateActiveDownloads(Array.from(activeDownloads.values()));
            
        } catch (error) {
            console.error('Error polling download status:', error);
        }
    }, 2000); // Poll every 2 seconds
    
    downloadPollingIntervals.set(downloadId, interval);
}

// Start polling for all active downloads
function startDownloadPolling() {
    // Poll every 5 seconds for any active downloads
    setInterval(async () => {
        if (activeDownloads.size > 0) {
            await loadDownloads();
        }
    }, 5000);
}

// Download file
async function downloadFile(downloadId) {
    try {
        const response = await fetch(`/api/download/${downloadId}/file`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to download file');
        }
        
        // Create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = ''; // Let browser determine filename
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotification('File download started!', 'success');
        
    } catch (error) {
        console.error('Error downloading file:', error);
        showNotification(error.message, 'error');
    }
}

// Delete download
async function deleteDownload(downloadId) {
    if (!confirm('Are you sure you want to delete this download?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/download/${downloadId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete download');
        }
        
        // Remove from active downloads if present
        activeDownloads.delete(downloadId);
        
        // Reload downloads
        await loadDownloads();
        
        showNotification('Download deleted successfully!', 'success');
        
    } catch (error) {
        console.error('Error deleting download:', error);
        showNotification(error.message, 'error');
    }
}

// Logout
function logout() {
    window.location.href = '/auth/logout';
}

// Utility functions
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || '<i class="fas fa-download"></i><span>Start Download</span>';
    }
}

function formatTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById(`${type}Notification`);
    const messageElement = document.getElementById(`${type}Message`);
    
    if (notification && messageElement) {
        messageElement.textContent = message;
        notification.classList.add('show');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            hideNotification(type);
        }, 5000);
    }
}

function hideNotification(type) {
    const notification = document.getElementById(`${type}Notification`);
    if (notification) {
        notification.classList.remove('show');
    }
}

// Store original button text
document.addEventListener('DOMContentLoaded', function() {
    const submitBtn = document.querySelector('.download-btn');
    if (submitBtn) {
        submitBtn.dataset.originalText = submitBtn.innerHTML;
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + Enter to submit download form
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        const form = document.getElementById('downloadForm');
        if (form) {
            form.dispatchEvent(new Event('submit'));
        }
    }
    
    // Escape to close notifications
    if (event.key === 'Escape') {
        hideNotification('success');
        hideNotification('error');
    }
});

// Add offline/online handling
window.addEventListener('online', function() {
    showNotification('Connection restored!', 'success');
    // Reload data when connection is restored
    loadDownloads();
});

window.addEventListener('offline', function() {
    showNotification('No internet connection. Please check your network.', 'error');
});
