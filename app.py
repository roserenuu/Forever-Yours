import os
import uuid
import glob
import json
import subprocess
import threading
import zipfile
import shutil
from flask import Flask, request, jsonify, send_file, render_template

app = Flask(__name__)
DOWNLOAD_DIR = os.path.join(os.path.dirname(__file__), "downloads")
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

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


def run_swap(job_id, video_path, url):
    job = jobs[job_id]
    sub_prefix = os.path.join(DOWNLOAD_DIR, f"{job_id}_cap")
    sub_template = f"{sub_prefix}.%(ext)s"

    cmd = [
        "yt-dlp", "--no-playlist", "--skip-download",
        "--write-subs", "--write-auto-subs",
        "--sub-format", "srt",
        "--sub-langs", "en.*,en",
        "-o", sub_template,
        url,
    ]

    try:
        subprocess.run(cmd, capture_output=True, text=True, timeout=60)

        sub_exts = (".srt", ".vtt", ".ass")
        sub_files = sorted(
            [f for f in glob.glob(f"{sub_prefix}.*") if f.endswith(sub_exts)],
            key=lambda f: (0 if f.endswith(".srt") else 1)
        )

        if not sub_files:
            job["status"] = "error"
            job["error"] = "No captions found for this URL"
            try:
                os.remove(video_path)
            except OSError:
                pass
            return

        sub_file = sub_files[0]
        out_path = os.path.join(DOWNLOAD_DIR, f"{job_id}_swapped.mp4")

        ffmpeg_cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-i", sub_file,
            "-c:v", "copy",
            "-c:a", "copy",
            "-c:s", "mov_text",
            "-metadata:s:s:0", "language=eng",
            out_path,
        ]
        result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True, timeout=300)

        for f in [video_path] + sub_files:
            try:
                os.remove(f)
            except OSError:
                pass

        if result.returncode != 0:
            job["status"] = "error"
            job["error"] = "ffmpeg failed to embed captions — make sure your video is a valid mp4/mov"
            return

        job["status"] = "done"
        job["file"] = out_path
        job["filename"] = "swapped_captioned.mp4"

    except subprocess.TimeoutExpired:
        job["status"] = "error"
        job["error"] = "Operation timed out"
    except Exception as e:
        job["status"] = "error"
        job["error"] = str(e)


def run_clean_tracks(job_id, video_path):
    job = jobs[job_id]
    out_path = os.path.join(DOWNLOAD_DIR, f"{job_id}_clean.mp4")
    cmd = [
        "ffmpeg", "-y", "-i", video_path,
        "-map", "0:v", "-map", "0:a?",
        "-c", "copy", out_path,
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        try:
            os.remove(video_path)
        except OSError:
            pass
        if result.returncode != 0:
            job["status"] = "error"
            job["error"] = "ffmpeg failed — make sure the file is a valid video"
            return
        job["status"] = "done"
        job["file"] = out_path
        job["filename"] = "clean_no_subtitles.mp4"
    except subprocess.TimeoutExpired:
        job["status"] = "error"
        job["error"] = "Processing timed out"
    except Exception as e:
        job["status"] = "error"
        job["error"] = str(e)


def run_ai_paint(job_id, video_path):
    job = jobs[job_id]
    frames_dir = os.path.join(DOWNLOAD_DIR, f"{job_id}_frames")
    out_path = os.path.join(DOWNLOAD_DIR, f"{job_id}_painted.mp4")
    os.makedirs(frames_dir, exist_ok=True)

    try:
        import cv2
        import easyocr
        import numpy as np

        # Get frame rate
        probe = subprocess.run(
            ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_streams", video_path],
            capture_output=True, text=True, timeout=30,
        )
        fps = "30"
        for stream in json.loads(probe.stdout).get("streams", []):
            if stream.get("codec_type") == "video":
                r = stream.get("r_frame_rate", "30/1")
                num, den = r.split("/")
                fps = str(round(int(num) / max(int(den), 1), 3))
                break

        # Extract frames
        subprocess.run(
            ["ffmpeg", "-y", "-i", video_path, f"{frames_dir}/%06d.png"],
            capture_output=True, check=True, timeout=300,
        )

        reader = easyocr.Reader(["en"], gpu=False, verbose=False)
        frame_files = sorted(glob.glob(os.path.join(frames_dir, "*.png")))
        total = len(frame_files)

        for i, frame_path in enumerate(frame_files):
            frame = cv2.imread(frame_path)
            if frame is None:
                continue
            results = reader.readtext(frame)
            mask = np.zeros(frame.shape[:2], dtype=np.uint8)
            for (bbox, _text, prob) in results:
                if prob > 0.25:
                    pts = np.array(bbox, dtype=np.int32)
                    pad = 8
                    x1 = max(0, int(pts[:, 0].min()) - pad)
                    y1 = max(0, int(pts[:, 1].min()) - pad)
                    x2 = min(frame.shape[1], int(pts[:, 0].max()) + pad)
                    y2 = min(frame.shape[0], int(pts[:, 1].max()) + pad)
                    mask[y1:y2, x1:x2] = 255
            if mask.max() > 0:
                frame = cv2.inpaint(frame, mask, 5, cv2.INPAINT_TELEA)
                cv2.imwrite(frame_path, frame)
            job["progress"] = int((i + 1) / total * 100)

        # Reassemble with original audio
        subprocess.run([
            "ffmpeg", "-y",
            "-framerate", fps,
            "-i", f"{frames_dir}/%06d.png",
            "-i", video_path,
            "-map", "0:v", "-map", "1:a?",
            "-c:v", "libx264", "-c:a", "copy",
            "-pix_fmt", "yuv420p",
            out_path,
        ], capture_output=True, check=True, timeout=600)

        job["status"] = "done"
        job["file"] = out_path
        job["filename"] = "ai_cleaned.mp4"

    except ImportError:
        job["status"] = "error"
        job["error"] = "AI libraries not installed — re-run reclip.sh to set up"
    except subprocess.CalledProcessError:
        job["status"] = "error"
        job["error"] = "Processing failed — check that ffmpeg is installed"
    except Exception as e:
        job["status"] = "error"
        job["error"] = str(e)
    finally:
        shutil.rmtree(frames_dir, ignore_errors=True)
        try:
            os.remove(video_path)
        except OSError:
            pass


@app.route("/api/clean-tracks", methods=["POST"])
def start_clean_tracks():
    video_file = request.files.get("video")
    if not video_file or not video_file.filename:
        return jsonify({"error": "No video file provided"}), 400
    job_id = uuid.uuid4().hex[:10]
    ext = os.path.splitext(video_file.filename)[1] or ".mp4"
    video_path = os.path.join(UPLOAD_DIR, f"{job_id}{ext}")
    video_file.save(video_path)
    jobs[job_id] = {"status": "processing", "title": ""}
    thread = threading.Thread(target=run_clean_tracks, args=(job_id, video_path))
    thread.daemon = True
    thread.start()
    return jsonify({"job_id": job_id})


@app.route("/api/ai-paint", methods=["POST"])
def start_ai_paint():
    video_file = request.files.get("video")
    if not video_file or not video_file.filename:
        return jsonify({"error": "No video file provided"}), 400
    job_id = uuid.uuid4().hex[:10]
    ext = os.path.splitext(video_file.filename)[1] or ".mp4"
    video_path = os.path.join(UPLOAD_DIR, f"{job_id}{ext}")
    video_file.save(video_path)
    jobs[job_id] = {"status": "processing", "title": "", "progress": 0}
    thread = threading.Thread(target=run_ai_paint, args=(job_id, video_path))
    thread.daemon = True
    thread.start()
    return jsonify({"job_id": job_id})


@app.route("/api/swap", methods=["POST"])
def start_swap():
    url = request.form.get("url", "").strip()
    video_file = request.files.get("video")

    if not url:
        return jsonify({"error": "No URL provided"}), 400
    if not video_file or not video_file.filename:
        return jsonify({"error": "No video file provided"}), 400

    job_id = uuid.uuid4().hex[:10]
    ext = os.path.splitext(video_file.filename)[1] or ".mp4"
    video_path = os.path.join(UPLOAD_DIR, f"{job_id}{ext}")
    video_file.save(video_path)

    jobs[job_id] = {"status": "processing", "url": url, "title": ""}

    thread = threading.Thread(target=run_swap, args=(job_id, video_path, url))
    thread.daemon = True
    thread.start()

    return jsonify({"job_id": job_id})


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
        "progress": job.get("progress"),
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
