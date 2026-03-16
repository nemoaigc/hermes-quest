#!/bin/bash
# Post-processing: TTS narration + BGM + subtitles → final video
set -e

DEMO_DIR="$(cd "$(dirname "$0")" && pwd)"
VIDEO_DIR="$DEMO_DIR/recordings"
AUDIO_DIR="$DEMO_DIR/audio"
OUTPUT="$DEMO_DIR/hermes-quest-demo.mp4"

mkdir -p "$AUDIO_DIR"

# 1. Find the recorded video
VIDEO=$(ls "$VIDEO_DIR"/*.webm 2>/dev/null | tail -1)
if [ -z "$VIDEO" ]; then
  echo "No video found in $VIDEO_DIR"
  exit 1
fi
echo "Video: $VIDEO"

# 2. Generate TTS narration for each scene
echo "Generating TTS narration..."
python3 << 'PYEOF'
import json, subprocess, os

demo_dir = os.path.dirname(os.path.abspath(__file__)) if '__file__' in dir() else os.getcwd()
narration = json.load(open(os.path.join(demo_dir, "narration.json")))
audio_dir = os.path.join(demo_dir, "audio")
os.makedirs(audio_dir, exist_ok=True)

for i, entry in enumerate(narration):
    text = entry["narration"]
    out_path = os.path.join(audio_dir, f"narration-{i:03d}.mp3")
    if os.path.exists(out_path):
        print(f"  Skip {entry['id']} (exists)")
        continue
    print(f"  Generating {entry['id']}: {text[:40]}...")
    try:
        subprocess.run([
            "edge-tts",
            "--voice", "zh-CN-YunxiNeural",
            "--text", text,
            "--write-media", out_path,
        ], check=True, capture_output=True, timeout=30)
    except Exception as e:
        print(f"  ERROR: {e}")
        # Create silent placeholder
        subprocess.run(["ffmpeg", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", "3", "-y", out_path],
                      capture_output=True)

print("TTS generation complete")
PYEOF

# 3. Download 8-bit BGM (if not exists)
BGM="$DEMO_DIR/bgm.mp3"
if [ ! -f "$BGM" ]; then
  echo "Downloading 8-bit BGM..."
  # Use a free chiptune loop from pixabay or similar
  # Fallback: generate a simple tone
  ffmpeg -f lavfi -i "sine=frequency=440:duration=180" -af "aformat=sample_rates=44100,volume=0.1" -y "$BGM" 2>/dev/null
  echo "BGM placeholder created (replace with real chiptune)"
fi

# 4. Build narration audio timeline
echo "Building narration timeline..."
python3 << 'PYEOF2'
import json, subprocess, os

demo_dir = os.path.dirname(os.path.abspath(__file__)) if '__file__' in dir() else os.getcwd()
narration = json.load(open(os.path.join(demo_dir, "narration.json")))
audio_dir = os.path.join(demo_dir, "audio")

# Get video duration
video = [f for f in os.listdir(os.path.join(demo_dir, "recordings")) if f.endswith(".webm")][-1]
video_path = os.path.join(demo_dir, "recordings", video)

# Build ffmpeg complex filter to place each narration at its timestamp
inputs = [f'-i "{video_path}"']  # input 0: video
inputs.append(f'-i "{os.path.join(demo_dir, "bgm.mp3")}"')  # input 1: bgm

filter_parts = []
n_inputs = 2  # video + bgm

for i, entry in enumerate(narration):
    mp3 = os.path.join(audio_dir, f"narration-{i:03d}.mp3")
    if os.path.exists(mp3):
        inputs.append(f'-i "{mp3}"')
        delay_ms = entry["start"]
        filter_parts.append(f"[{n_inputs}]adelay={delay_ms}|{delay_ms}[n{i}]")
        n_inputs += 1

# Mix all narrations together
if filter_parts:
    narr_labels = [f"[n{i}]" for i in range(len(narration)) if os.path.exists(os.path.join(audio_dir, f"narration-{i:03d}.mp3"))]
    mix = "".join(narr_labels) + f"amix=inputs={len(narr_labels)}:normalize=0[narr]"
    filter_parts.append(mix)
    # Mix narration with BGM (bgm at low volume)
    filter_parts.append("[1]volume=0.15[bgm_low]")
    filter_parts.append("[narr][bgm_low]amix=inputs=2:normalize=0[final_audio]")
else:
    filter_parts.append("[1]volume=0.15[final_audio]")

filter_str = ";\n".join(filter_parts)

# Build ffmpeg command
cmd = f"""ffmpeg {' '.join(inputs)} \\
  -filter_complex "{filter_str}" \\
  -map 0:v -map "[final_audio]" \\
  -vf "subtitles='{os.path.join(demo_dir, 'subtitles.srt')}':force_style='FontName=Press Start 2P,FontSize=14,PrimaryColour=&H00f0e68c,OutlineColour=&H000a0814,BorderStyle=3,Outline=2,Shadow=1,MarginV=30'" \\
  -c:v libx264 -preset fast -crf 23 \\
  -c:a aac -b:a 128k \\
  -shortest -y "{os.path.join(demo_dir, 'hermes-quest-demo.mp4')}"
"""

print("FFmpeg command:")
print(cmd)
with open(os.path.join(demo_dir, "ffmpeg-cmd.sh"), "w") as f:
    f.write("#!/bin/bash\n" + cmd)
os.chmod(os.path.join(demo_dir, "ffmpeg-cmd.sh"), 0o755)
print("\nSaved to ffmpeg-cmd.sh — run it to produce final video")
PYEOF2

echo ""
echo "=== Done ==="
echo "1. Video recorded in $VIDEO_DIR/"
echo "2. SRT subtitles in $DEMO_DIR/subtitles.srt"
echo "3. TTS audio in $AUDIO_DIR/"
echo "4. Run $DEMO_DIR/ffmpeg-cmd.sh to produce final video"
