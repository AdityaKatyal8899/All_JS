from flask import Flask, request, jsonify, send_from_directory
import mainDownloader
import os
import logging

app = Flask(__name__)

# --- Helper to get user from token ---
def get_user_from_token(token):
    """
    TODO: Implement actual Google Auth token verification here.
    For now, we return a mock user for demonstration.
    """
    if not token:
        return None
    # Replace with real verification using Google API
    return {
        "id": 1,
        "name": "Test User",
        "email": "test@example.com"
    }
# --- Auth decorator ---
def require_auth(f):
    def wrapper(*args, **kwargs):
        token = request.headers.get("Authorization")
        user = get_user_from_token(token)
        if not user:
            return jsonify({"success": False, "error": "Unauthorized"}), 401
        request.user = user
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper
@app.route('/api/user/feed', methods=['GET'])
@require_auth
def get_user_feed():
    # Get user cookies
    yt_cookies = request.cookies  # this is a dict-like object
    # Example: access SID cookie
    sid_cookie = yt_cookies.get("SID")

    if not sid_cookie:
        return jsonify({"success": False, "error": "Missing YouTube session cookies"}), 400

    try:
        # Pass cookies to your mainDownloader function
        feed = mainDownloader.fetch_user_feed(cookies=yt_cookies)
        return jsonify({"success": True, "feed": feed})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
# --- Download endpoints ---
@app.route('/api/download/video', methods=['POST'])
@require_auth
def download_video():
    data = request.json
    url = data.get('url')
    format_id = data.get('format_id')
    if not url or not format_id:
        return jsonify({'success': False, 'error': 'Missing url or format_id'}), 400
    try:
        result = mainDownloader.download_video_api(url, format_id)
        return jsonify({'success': True, 'files': [result], 'title': result['title'], 'thumbnail': result['thumbnail']})
    except Exception as e:
        logging.exception(e)
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/download/audio', methods=['POST'])
@require_auth
def download_audio():
    data = request.json
    url = data.get('url')
    format_id = data.get('format_id')
    if not url or not format_id:
        return jsonify({'success': False, 'error': 'Missing url or format_id'}), 400
    try:
        result = mainDownloader.download_audio_api(url, format_id)
        return jsonify({'success': True, 'files': [result], 'title': result['title'], 'thumbnail': result['thumbnail']})
    except Exception as e:
        logging.exception(e)
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/download/short', methods=['POST'])
@require_auth
def download_short():
    data = request.json
    url = data.get('url')
    if not url:
        return jsonify({'success': False, 'error': 'Missing url'}), 400
    try:
        result = mainDownloader.download_short_api(url)
        return jsonify({'success': True, 'files': [result], 'title': result['title'], 'thumbnail': result['thumbnail']})
    except Exception as e:
        logging.exception(e)
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/download/reel', methods=['POST'])
@require_auth
def download_reel():
    data = request.json
    url = data.get('url')
    if not url:
        return jsonify({'success': False, 'error': 'Missing url'}), 400
    try:
        result = mainDownloader.download_reel_api(url)
        return jsonify({'success': True, 'files': [result], 'title': result['title'], 'thumbnail': result['thumbnail']})
    except Exception as e:
        logging.exception(e)
        return jsonify({'success': False, 'error': str(e)}), 500

# --- Formats endpoint ---
@app.route('/api/formats', methods=['POST'])
@require_auth
def get_formats():
    data = request.json
    url = data.get('url')
    if not url:
        return jsonify({'success': False, 'error': 'Missing url'}), 400
    try:
        formats = mainDownloader.get_formats_api(url)
        return jsonify({'success': True, 'formats': formats})
    except Exception as e:
        logging.exception(e)
        return jsonify({'success': False, 'error': str(e)}), 500

# --- File serving ---
@app.route('/api/file/<filename>')
@require_auth
def serve_file(filename):
    downloads_dir = os.environ.get('DOWNLOAD_PATH', './downloads')
    return send_from_directory(downloads_dir, filename, as_attachment=True)

# --- Get user downloads ---
@app.route('/api/downloads', methods=['GET'])
@require_auth
def get_downloads():
    user_id = request.user['id']
    # TODO: Replace this static example with actual DB query
    downloads = [
        {
            "id": "123",
            "youtubeUrl": "https://www.youtube.com/watch?v=abc",
            "fileType": "video",
            "status": "completed",
            "youtubeTitle": "Sample Video",
            "youtubeThumbnail": "",
            "fileSize": "10 MB",
            "isExpired": False,
            "downloadedAt": "2025-08-16T10:00:00"
        }
    ]
    return jsonify(downloads)

if __name__ == "__main__":
    app.run(debug=True)
