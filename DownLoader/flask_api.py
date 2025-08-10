from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import ffmpeg
import os
import json
import tempfile
import shutil
from datetime import datetime
from mainDownloader import readable_size, is_reasonable, sort_and_print_formats

app = Flask(__name__)
CORS(app)

# Configuration
DOWNLOAD_PATH = os.environ.get('DOWNLOAD_PATH', 'downloads')
if not os.path.exists(DOWNLOAD_PATH):
    os.makedirs(DOWNLOAD_PATH)

def get_available_formats(url):
    """Get available formats for a YouTube URL"""
    try:
        with yt_dlp.YoutubeDL({'cookiefile': 'youtube_cookies.txt'}) as ydl_info:
            vid_info = ydl_info.extract_info(url, download=False)
        
        formats = vid_info.get("formats", [])
        allowed_video_audio = []
        blocked_video_audio = []
        video_only_all = {}
        audio_only_all = []
        
        for f in formats:
            fmt_id = f.get("format_id")
            vcodec = f.get("vcodec")
            acodec = f.get("acodec")
            width = f.get("width") or 0
            height = f.get("height") or 0
            filesize = f.get("filesize") or f.get("filesize_approx")
            ext = f.get("ext", "unknown")
            format_note = f.get("format_note", "").lower()
            
            if not fmt_id or not filesize:
                continue
                
            info = {
                "id": fmt_id,
                "ext": ext,
                "res": f"{width}x{height}" if width and height else format_note,
                "height": height,
                "width": width,
                "filesize": filesize,
                "size_str": readable_size(filesize),
                "format_note": format_note
            }
            
            if vcodec != "none" and acodec != "none":
                if is_reasonable(filesize, height):
                    allowed_video_audio.append(info)
                else:
                    blocked_video_audio.append(info)
            elif vcodec != "none":
                resolution_key = f"{width}x{height}"
                prev = video_only_all.get(resolution_key)
                if not prev or filesize > prev["filesize"]:
                    video_only_all[resolution_key] = info
            elif acodec != "none":
                if "low" in format_note or "tiny" in format_note:
                    continue
                audio_only_all.append(info)
        
        allowed_video_audio.sort(key=lambda x: x["height"], reverse=True)
        blocked_video_audio.sort(key=lambda x: x["height"], reverse=True)
        video_only = list(video_only_all.values())
        video_only.sort(key=lambda x: x["height"], reverse=True)
        audio_only_all.sort(key=lambda x: x["filesize"], reverse=True)
        
        return {
            "success": True,
            "video_info": {
                "title": vid_info.get("title", "Unknown"),
                "thumbnail": vid_info.get("thumbnail", ""),
                "duration": vid_info.get("duration", 0),
                "uploader": vid_info.get("uploader", "Unknown")
            },
            "formats": {
                "video_audio": allowed_video_audio,
                "video_audio_blocked": blocked_video_audio,
                "video_only": video_only,
                "audio_only": audio_only_all
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def download_youtube_video(url, format_id, output_dir=DOWNLOAD_PATH):
    """Download YouTube video with specified format"""
    try:
        # Create unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_template = os.path.join(output_dir, f"%(title)s_{timestamp}_%(format_id)s.%(ext)s")
        
        ydl_opts = {
            'format': format_id,
            'outtmpl': output_template,
            'merge_output_format': 'mp4',
            'cookiefile': 'youtube_cookies.txt'
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Get video info first
            info = ydl.extract_info(url, download=False)
            title = info.get('title', 'Unknown')
            
            # Download the video
            ydl.download([url])
            
            # Find the downloaded file
            downloaded_files = []
            for file in os.listdir(output_dir):
                if file.endswith('.mp4') and timestamp in file:
                    file_path = os.path.join(output_dir, file)
                    file_size = os.path.getsize(file_path)
                    downloaded_files.append({
                        "filename": file,
                        "filepath": file_path,
                        "filesize": file_size,
                        "size_str": readable_size(file_size)
                    })
            
            return {
                "success": True,
                "title": title,
                "thumbnail": info.get('thumbnail', ''),
                "files": downloaded_files
            }
            
    except Exception as e:
        return {"success": False, "error": str(e)}

def download_youtube_audio(url, output_dir=DOWNLOAD_PATH):
    """Download YouTube video as audio (MP3)"""
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_template = os.path.join(output_dir, f"%(title)s_{timestamp}.%(ext)s")
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': output_template,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'cookiefile': 'youtube_cookies.txt'
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            title = info.get('title', 'Unknown')
            
            ydl.download([url])
            
            # Find the downloaded file
            downloaded_files = []
            for file in os.listdir(output_dir):
                if file.endswith('.mp3') and timestamp in file:
                    file_path = os.path.join(output_dir, file)
                    file_size = os.path.getsize(file_path)
                    downloaded_files.append({
                        "filename": file,
                        "filepath": file_path,
                        "filesize": file_size,
                        "size_str": readable_size(file_size)
                    })
            
            return {
                "success": True,
                "title": title,
                "thumbnail": info.get('thumbnail', ''),
                "files": downloaded_files
            }
            
    except Exception as e:
        return {"success": False, "error": str(e)}

def download_youtube_short(url, output_dir=DOWNLOAD_PATH):
    """Download YouTube Short"""
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_template = os.path.join(output_dir, f"%(title)s_short_{timestamp}.%(ext)s")
        
        ydl_opts = {
            'format': 'bestvideo+bestaudio/best',
            'outtmpl': output_template,
            'merge_output_format': 'mp4',
            'noplaylist': True,
            'cookiefile': 'youtube_cookies.txt'
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            title = info.get('title', 'Unknown')
            
            ydl.download([url])
            
            # Find the downloaded file
            downloaded_files = []
            for file in os.listdir(output_dir):
                if file.endswith('.mp4') and timestamp in file:
                    file_path = os.path.join(output_dir, file)
                    file_size = os.path.getsize(file_path)
                    downloaded_files.append({
                        "filename": file,
                        "filepath": file_path,
                        "filesize": file_size,
                        "size_str": readable_size(file_size)
                    })
            
            return {
                "success": True,
                "title": title,
                "thumbnail": info.get('thumbnail', ''),
                "files": downloaded_files
            }
            
    except Exception as e:
        return {"success": False, "error": str(e)}

def download_instagram_reel(url, output_dir=DOWNLOAD_PATH):
    """Download Instagram Reel"""
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_template = os.path.join(output_dir, f"%(title)s_reel_{timestamp}.%(ext)s")
        
        ydl_opts = {
            'format': 'best',
            'outtmpl': output_template,
            'merge_output_format': 'mp4',
            'cookiefile': 'instagram_cookies.txt'
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            title = info.get('title', 'Unknown')
            
            ydl.download([url])
            
            # Find the downloaded file
            downloaded_files = []
            for file in os.listdir(output_dir):
                if file.endswith('.mp4') and timestamp in file:
                    file_path = os.path.join(output_dir, file)
                    file_size = os.path.getsize(file_path)
                    downloaded_files.append({
                        "filename": file,
                        "filepath": file_path,
                        "filesize": file_size,
                        "size_str": readable_size(file_size)
                    })
            
            return {
                "success": True,
                "title": title,
                "thumbnail": info.get('thumbnail', ''),
                "files": downloaded_files
            }
            
    except Exception as e:
        return {"success": False, "error": str(e)}

# API Routes
@app.route('/api/formats', methods=['POST'])
def get_formats():
    """Get available formats for a URL"""
    data = request.get_json()
    url = data.get('url')
    
    if not url:
        return jsonify({"success": False, "error": "URL is required"}), 400
    
    result = get_available_formats(url)
    return jsonify(result)

@app.route('/api/download/video', methods=['POST'])
def download_video():
    """Download YouTube video with specific format"""
    data = request.get_json()
    url = data.get('url')
    format_id = data.get('format_id')
    
    if not url or not format_id:
        return jsonify({"success": False, "error": "URL and format_id are required"}), 400
    
    result = download_youtube_video(url, format_id)
    return jsonify(result)

@app.route('/api/download/audio', methods=['POST'])
def download_audio():
    """Download YouTube video as audio"""
    data = request.get_json()
    url = data.get('url')
    
    if not url:
        return jsonify({"success": False, "error": "URL is required"}), 400
    
    result = download_youtube_audio(url)
    return jsonify(result)

@app.route('/api/download/short', methods=['POST'])
def download_short():
    """Download YouTube Short"""
    data = request.get_json()
    url = data.get('url')
    
    if not url:
        return jsonify({"success": False, "error": "URL is required"}), 400
    
    result = download_youtube_short(url)
    return jsonify(result)

@app.route('/api/download/reel', methods=['POST'])
def download_reel():
    """Download Instagram Reel"""
    data = request.get_json()
    url = data.get('url')
    
    if not url:
        return jsonify({"success": False, "error": "URL is required"}), 400
    
    result = download_instagram_reel(url)
    return jsonify(result)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "Flask Downloader API"})

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
