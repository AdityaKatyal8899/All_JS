# Google OAuth2 Web Application

A basic full-stack web application that demonstrates Google OAuth2 integration using Node.js, Express, and vanilla JavaScript.

## Features

- **Frontend**: Clean, modern UI with vanilla HTML, CSS, and JavaScript
- **Backend**: Node.js with Express server
- **Authentication**: Google OAuth2 integration with minimal scopes (openid, profile)
- **User Data**: Displays user's name and profile picture after successful login

## Project Structure

```
├── server.js              # Main Express server
├── package.json           # Node.js dependencies
├── env.example           # Environment variables template
├── public/               # Frontend files
│   ├── index.html        # Login page
│   ├── success.html      # Success page
│   ├── styles.css        # CSS styles
│   ├── script.js         # Login page JavaScript
│   └── success.js        # Success page JavaScript
└── README.md             # This file
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Google OAuth2

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (or Google Identity API)
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Set the authorized redirect URI to: `http://localhost:3000/auth/google/callback`
6. Copy your Client ID and Client Secret

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp env.example .env
```

Edit the `.env` file with your Google OAuth credentials:

```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
REDIRECT_URI=http://localhost:3000/auth/google/callback
PORT=3000
```

### 4. Start the Application

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`

## How It Works

1. **Login Page** (`/`): Displays a "Sign in with Google" button
2. **OAuth Initiation** (`/auth/google`): Redirects to Google's OAuth consent screen
3. **OAuth Callback** (`/auth/google/callback`): Handles Google's response and fetches user data
4. **Success Page** (`/success`): Displays user's name and profile picture

## OAuth Scopes

The application requests only basic scopes:
- `openid`: For OpenID Connect authentication
- `https://www.googleapis.com/auth/userinfo.profile`: For basic profile information

No email or other sensitive scopes are requested.

## Security Notes

- This is a basic implementation for demonstration purposes
- No session management or database storage is implemented
- User data is passed via URL parameters (not recommended for production)
- In a production environment, you should implement proper session management and secure data storage

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**: Make sure the redirect URI in Google Cloud Console matches exactly: `http://localhost:3000/auth/google/callback`

2. **"OAuth authentication failed"**: Check that your Client ID and Client Secret are correct in the `.env` file

3. **"No user data found"**: This usually means the OAuth flow was interrupted or failed

### Development Tips

- Use `npm run dev` for development with auto-restart
- Check the browser console and server logs for error messages
- Ensure your Google OAuth2 credentials are properly configured

## Technologies Used

- **Backend**: Node.js, Express, googleapis
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Authentication**: Google OAuth2
- **Styling**: Modern CSS with gradients and animations
