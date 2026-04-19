import os
import uuid
import glob
import json
import subprocess
import threading
import zipfile
from flask import Flask, request, jsonify, send_file, render_template

app = Flask(__name__)
DOWNLOAD_DIR = os.path.join(os.path.dirname(__file__), "downloads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

jobs = {}


def safe_title_prefix(title, max_len=20):
    if not title:
        return ""
    return "".join(c for c in title if c not in r'\/:*?"<>|').strip()[:max_len].strip()


def run_download(job_id, url, format_choice, format_id, captions):
    job = jobs[job_id]
    out_template = os.path.join(DOWNLOAD_DIR, f"{job_id}.%(ext)s")

    cmd = ["yt-dlp", "--no-playlist", "-o", out_template]

    if format_choice == "audio":
        cmd += ["-x", "--audio-format", "mp3"]
    elif format_id:
        cmd += ["-f", f"{format_id}+bestaudio/best", "--merge-output-format", "mp4"]
    else:
        cmd += ["-f", "bestvideo+bestaudio/best", "--merge-output-format", "mp4"]

    if captions:
        cmd += ["--write-subs", "--write-auto-subs", "--sub-format", "srt",
                "--sub-langs", "en.*,en"]

    cmd.append(url)

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        if result.returncode != 0:
            job["status"] = "error"
            job["error"] = result.stderr.strip().split("\n")[-1]
            return

        all_files = glob.glob(os.path.join(DOWNLOAD_DIR, f"{job_id}.*"))
        if not all_files:
            job["status"] = "error"
            job["error"] = "Download completed but no file was found"
            return

        sub_exts = (".srt", ".vtt", ".ass", ".ssa")
        sub_files = [f for f in all_files if f.endswith(sub_exts)]

        if format_choice == "audio":
            media = next((f for f in all_files if f.endswith(".mp3")), all_files[0])
        else:
            media = next((f for f in all_files if f.endswith(".mp4")), all_files[0])

        title = job.get("title", "").strip()
        prefix = safe_title_prefix(title)

        if captions and sub_files:
            zip_path = os.path.join(DOWNLOAD_DIR, f"{job_id}.zip")
            media_name = f"{prefix}{os.path.splitext(media)[1]}" if prefix else os.path.basename(media)
            with zipfile.ZipFile(zip_path, "w") as zf:
                zf.write(media, media_name)
                for sf in sub_files:
                    zf.write(sf, os.path.basename(sf))
            for f in all_files:
                try:
                    os.remove(f)
                except OSError:
                    pass
            job["status"] = "done"
            job["file"] = zip_path
            job["filename"] = f"{prefix}.zip" if prefix else f"{job_id}.zip"
        else:
            for f in all_files:
                if f != media:
                    try:
                        os.remove(f)
                    except OSError:
                        pass
            ext = os.path.splitext(media)[1]
            job["status"] = "done"
            job["file"] = media
            job["filename"] = f"{prefix}{ext}" if prefix else os.path.basename(media)

    except subprocess.TimeoutExpired:
        job["status"] = "error"
        job["error"] = "Download timed out (5 min limit)"
    except Exception as e:
        job["status"] = "error"
        job["error"] = str(e)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/info", methods=["POST"])
def get_info():
    data = request.json
    url = data.get("url", "").strip()
    if not url:
        return jsonify({"error": "No URL provided"}), 400

    cmd = ["yt-dlp", "--no-playlist", "-j", url]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if result.returncode != 0:
            return jsonify({"error": result.stderr.strip().split("\n")[-1]}), 400

        info = json.loads(result.stdout)

        best_by_height = {}
        for f in info.get("formats", []):
            height = f.get("height")
            if height and f.get("vcodec", "none") != "none":
                tbr = f.get("tbr") or 0
                if height not in best_by_height or tbr > (best_by_height[height].get("tbr") or 0):
                    best_by_height[height] = f

        formats = []
        for height, f in best_by_height.items():
            formats.append({
                "id": f["format_id"],
                "label": f"{height}p",
                "height": height,
            })
        formats.sort(key=lambda x: x["height"], reverse=True)

        return jsonify({
            "title": info.get("title", ""),
            "thumbnail": info.get("thumbnail", ""),
            "duration": info.get("duration"),
            "uploader": info.get("uploader", ""),
            "formats": formats,
        })
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Timed out fetching video info"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/download", methods=["POST"])
def start_download():
    data = request.json
    url = data.get("url", "").strip()
    format_choice = data.get("format", "video")
    format_id = data.get("format_id")
    title = data.get("title", "")
    captions = bool(data.get("captions", False))

    if not url:
        return jsonify({"error": "No URL provided"}), 400

    job_id = uuid.uuid4().hex[:10]
    jobs[job_id] = {"status": "downloading", "url": url, "title": title}

    thread = threading.Thread(target=run_download, args=(job_id, url, format_choice, format_id, captions))
    thread.daemon = True
    thread.start()

    return jsonify({"job_id": job_id})


@app.route("/api/status/<job_id>")
def check_status(job_id):
    job = jobs.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify({
        "status": job["status"],
        "error": job.get("error"),
        "filename": job.get("filename"),
    })


@app.route("/api/file/<job_id>")
def download_file(job_id):
    job = jobs.get(job_id)
    if not job or job["status"] != "done":
        return jsonify({"error": "File not ready"}), 404
    return send_file(job["file"], as_attachment=True, download_name=job["filename"])


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8899))
    host = os.environ.get("HOST", "127.0.0.1")
    app.run(host=host, port=port)
