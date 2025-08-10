# YouTube Downloader

A production-ready YouTube downloader application with Google OAuth authentication, built with Node.js, Express, MongoDB, and a modern responsive frontend.

## Features

### 🔐 Authentication
- Google OAuth 2.0 login
- Secure session management
- Automatic token refresh
- User profile management

### 📥 Download Capabilities
- Download YouTube videos in multiple quality formats
- Extract audio in MP3 format
- Download YouTube Shorts
- Download Instagram Reels
- High-quality downloads using yt-dlp
- Background processing with real-time status updates
- Format selection with quality options

### 🎨 Modern UI/UX
- Responsive design (mobile-first)
- Vibrant color scheme with smooth animations
- Real-time download progress tracking
- Interactive dashboard with download history
- Beautiful landing page with animated background

### 🔧 Technical Features
- MongoDB Atlas integration
- Automatic file cleanup (configurable expiry)
- Cron jobs for maintenance tasks
- RESTful API with proper error handling
- Security headers and CORS configuration
- File upload handling with Multer

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database (with Mongoose ODM)
- **Passport.js** - Authentication middleware
- **Multer** - File upload handling
- **Node-cron** - Scheduled tasks

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Flexbox/Grid
- **Vanilla JavaScript** - No frameworks, pure JS
- **Font Awesome** - Icons
- **Google Fonts** - Typography

### Python Integration
- **Flask** - Python web framework for API
- **yt-dlp** - YouTube downloading library
- **FFmpeg** - Audio/video processing
- **Flask-CORS** - Cross-origin resource sharing

## Prerequisites

Before running this application, make sure you have:

1. **Node.js** (v14 or higher)
2. **Python** (v3.7 or higher)
3. **FFmpeg** installed on your system
4. **MongoDB Atlas** account (or local MongoDB)
5. **Google OAuth** credentials

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd youtube-downloader
```

### 2. Install Node.js dependencies
```bash
npm install
```

### 3. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 4. Install FFmpeg

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

**macOS:**
```bash
# Using Homebrew
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install ffmpeg
```

### 5. Environment Configuration

Create a `.env` file in the root directory:

```env
# MongoDB Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/youtube-downloader

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Session Configuration
SESSION_SECRET=your_session_secret_here

# Server Configuration
PORT=3000
NODE_ENV=development

# File Storage
DOWNLOAD_PATH=./downloads
FILE_EXPIRY_HOURS=24
```

### 6. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)
7. Copy the Client ID and Client Secret to your `.env` file

### 7. MongoDB Setup

1. Create a MongoDB Atlas account or use local MongoDB
2. Create a new database called `youtube-downloader`
3. Update the `MONGO_URI` in your `.env` file

## Running the Application

### 1. Start the Flask API (Python Backend)
```bash
# In one terminal
python flask_api.py
```

The Flask API will be available at `http://localhost:5001`

### 2. Start the Node.js Server
```bash
# In another terminal
npm run dev
```

### 3. Production Mode
```bash
# Start Flask API
python flask_api.py

# Start Node.js server
npm start
```

The main application will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `GET /auth/google` - Start Google OAuth login
- `GET /auth/google/callback` - OAuth callback handler
- `GET /auth/logout` - Logout user
- `GET /auth/status` - Check authentication status

### User Management
- `GET /api/user` - Get current user profile
- `GET /api/downloads` - Get user's download history
- `POST /api/formats` - Get available formats for a URL
- `POST /api/download` - Start a new download
- `GET /api/download/:id` - Get download status
- `GET /api/download/:id/file` - Download completed file
- `DELETE /api/download/:id` - Delete download

### Flask API Endpoints
- `POST /api/formats` - Get available formats for a URL
- `POST /api/download/video` - Download YouTube video with specific format
- `POST /api/download/audio` - Download YouTube video as audio
- `POST /api/download/short` - Download YouTube Short
- `POST /api/download/reel` - Download Instagram Reel
- `GET /api/health` - Health check endpoint

## File Structure

```
youtube-downloader/
├── models/
│   ├── User.js          # User model with OAuth tokens
│   └── Download.js      # Download model
├── routes/
│   ├── auth.js          # Authentication routes
│   └── api.js           # API routes
├── utils/
│   ├── passport.js      # Passport configuration
│   └── cronJobs.js      # Scheduled tasks
├── public/
│   ├── index.html       # Landing page
│   ├── dashboard.html   # Dashboard page
│   ├── styles.css       # Main stylesheet
│   ├── script.js        # Landing page JS
│   └── dashboard.js     # Dashboard JS
├── downloads/           # Downloaded files (auto-created)
├── mainDownloader.py    # Main Python downloader script
├── flask_api.py         # Flask API wrapper
├── server.js           # Main server file
├── package.json        # Node.js dependencies
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | Required |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Required |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Required |
| `SESSION_SECRET` | Session encryption secret | Required |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `DOWNLOAD_PATH` | File storage directory | ./downloads |
| `FILE_EXPIRY_HOURS` | File expiration time | 24 |
| `FLASK_API_URL` | Flask API URL | http://localhost:5001 |

### Cron Jobs

The application runs several automated tasks:

- **File Cleanup**: Every hour, removes expired files
- **Token Refresh**: Every 30 minutes, refreshes expired OAuth tokens
- **Failed Downloads Cleanup**: Every 2 hours, removes failed downloads older than 1 hour

## Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Session Management** - Secure session storage
- **Input Validation** - Request validation
- **File Upload Limits** - 100MB file size limit
- **Authentication Middleware** - Protected routes

## Performance Features

- **Database Indexing** - Optimized queries
- **File Streaming** - Efficient file downloads
- **Background Processing** - Non-blocking downloads
- **Caching** - Session-based caching
- **Compression** - Response compression

## Troubleshooting

### Common Issues

1. **FFmpeg not found**
   - Ensure FFmpeg is installed and in your system PATH
   - Restart your terminal after installation

2. **Python script errors**
   - Verify Python 3.7+ is installed
   - Install requirements: `pip install -r requirements.txt`

3. **MongoDB connection issues**
   - Check your MongoDB URI in `.env`
   - Ensure network access is configured in MongoDB Atlas

4. **Google OAuth errors**
   - Verify redirect URIs in Google Cloud Console
   - Check client ID and secret in `.env`

5. **File download failures**
   - Check available disk space
   - Verify YouTube URL is valid
   - Check internet connection

### Logs

Check the console output for detailed error messages. The application logs:
- Database connection status
- OAuth authentication events
- Download progress and errors
- Cron job execution status

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

## Acknowledgments

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - YouTube downloading library
- [Passport.js](http://www.passportjs.org/) - Authentication middleware
- [Font Awesome](https://fontawesome.com/) - Icons
- [Google Fonts](https://fonts.google.com/) - Typography
