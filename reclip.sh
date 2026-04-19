#!/bin/bash
set -e
cd "$(dirname "$0")"

# Check prerequisites
missing=""

if ! command -v python3 &> /dev/null; then
    missing="$missing python3"
fi

if ! command -v yt-dlp &> /dev/null; then
    missing="$missing yt-dlp"
fi

if ! command -v ffmpeg &> /dev/null; then
    missing="$missing ffmpeg"
fi

if [ -n "$missing" ]; then
    echo "Missing required tools:$missing"
    echo ""
    if command -v brew &> /dev/null; then
        echo "Install with:  brew install$missing"
    elif command -v apt &> /dev/null; then
        echo "Install with:  sudo apt install$missing"
    else
        echo "Please install:$missing"
    fi
    exit 1
fi

# Set up venv and install Python deps
if [ ! -d "venv" ]; then
    echo "Setting up virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -q flask yt-dlp
else
    source venv/bin/activate
    pip install -q flask yt-dlp
fi

# Optional: AI paint dependencies. Don't fail the whole script if they can't install.
if [ "$1" = "--with-ai" ] || [ "$INSTALL_AI" = "1" ]; then
    echo "Installing AI paint dependencies (this may take a while)..."
    pip install opencv-python easyocr || echo "AI paint deps failed to install — other features will still work."
fi

PORT="${PORT:-8899}"
export PORT

echo ""
echo "  ReClip is running at http://localhost:$PORT"
echo ""
python3 app.py
