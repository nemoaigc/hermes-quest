"""
Generate frame-by-frame animation from a static pixel art background via Gemini.

Chain generation: original(F1) → generate F2 → use F2 to generate F3 → use F3 to generate F4
All within the same Gemini chat session for consistency.

Usage:
  python gemini_animate.py tavern   # animate npc-bg.png (4 frames)
  python gemini_animate.py shop     # animate shop-bg.png
  python gemini_animate.py map      # animate map-bg.png
  python gemini_animate.py guild    # animate bulletin-bg.png
  python gemini_animate.py all      # animate all backgrounds
"""

import sys
import time
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

PROJECT_ROOT = Path(__file__).parent.parent
BG_DIR = PROJECT_ROOT / "public" / "bg"
ANIM_DIR = PROJECT_ROOT / "public" / "bg" / "anim"

# Reuse profile from gemini_generate.py
PROFILE_DIR = Path.home() / ".hermes-gemini-profile"

# ---- Animation prompts per scene ----
# Each scene has 3 prompts (F2, F3, F4). F1 is the original image.
# F4 should loop back to F1.

ANIM_PROMPTS = {
    "tavern": {
        "source": BG_DIR / "npc-bg-original.png",  # use the high-res original
        "fallback": BG_DIR / "npc-bg.png",
        "output_prefix": "tavern",
        "frames": [
            # F2: fire brighter, candle tilt left
            "请基于这张像素风酒馆图片生成动画的下一帧。只做极微小的变化：\n"
            "1. 壁炉火焰稍微变大一点，火焰形状略有不同\n"
            "2. 吊灯上的蜡烛火焰轻微向左倾斜\n"
            "3. 桌上的提灯光晕稍微变亮\n"
            "其他所有内容（人物姿态、构图、颜色、家具位置）必须完全保持不变。\n"
            "保持完全相同的像素画风格和分辨率。输出图片尺寸和输入完全一致。",

            # F3: fire shape changes, candle tilt right
            "请基于这张图片继续生成动画的下一帧。只做极微小的变化：\n"
            "1. 壁炉火焰回到正常大小，但火焰形状与上一帧略有不同\n"
            "2. 蜡烛火焰轻微向右倾斜\n"
            "3. 提灯光晕回到正常亮度\n"
            "其他所有内容必须完全保持不变。保持相同的像素画风格和分辨率。",

            # F4: fire slightly smaller, candles center — loops back to F1
            "请基于这张图片生成动画的最后一帧。这一帧需要能和动画的第一帧自然衔接形成循环。只做极微小的变化：\n"
            "1. 壁炉火焰稍微变小一点点，火焰形状再次略微变化\n"
            "2. 蜡烛火焰回到中间位置\n"
            "3. 整体光影回到接近第一帧的状态\n"
            "其他所有内容必须完全保持不变。保持相同的像素画风格和分辨率。",
        ],
    },
    "shop": {
        "source": BG_DIR / "shop-bg.png",
        "output_prefix": "shop",
        "frames": [
            # F2: candle brighter, crystal ball pulse, cat tail
            "请基于这张像素风魔法商店图片生成动画的下一帧。只做极微小的变化：\n"
            "1. 两侧烛台的火焰轻微向左倾斜，光晕稍微变亮\n"
            "2. 左上角水晶球的紫色光芒稍微增强\n"
            "3. 墙上的符文发光稍微变亮\n"
            "其他所有内容（家具位置、猫的姿态、构图）必须完全保持不变。\n"
            "保持完全相同的像素画风格和分辨率。",

            # F3: candle tilt right, crystal dim, rune shift
            "请基于这张图片继续生成动画的下一帧。只做极微小的变化：\n"
            "1. 烛台火焰轻微向右倾斜\n"
            "2. 水晶球光芒回到正常亮度\n"
            "3. 符文发光颜色微微变化\n"
            "其他所有内容必须完全保持不变。保持相同的像素画风格和分辨率。",

            # F4: loop back
            "请基于这张图片生成动画的最后一帧。这一帧需要能和第一帧自然衔接形成循环。只做极微小的变化：\n"
            "1. 烛台火焰回到中间，光晕恢复正常\n"
            "2. 水晶球光芒稍微减弱\n"
            "3. 符文发光回到接近第一帧的状态\n"
            "其他所有内容必须完全保持不变。保持相同的像素画风格和分辨率。",
        ],
    },
    "map": {
        "source": BG_DIR / "map-bg.png",
        "output_prefix": "map",
        "frames": [
            # F2: hourglass sand, candle flicker
            "请基于这张像素风地图桌面图片生成动画的下一帧。只做极微小的变化：\n"
            "1. 沙漏中的沙粒位置略有变化（沙子在流动）\n"
            "2. 如果画面中有蜡烛或光源，火焰轻微摇曳\n"
            "3. 指南针的指针微微偏转一点点\n"
            "其他所有内容（桌面物品位置、构图、颜色）必须完全保持不变。\n"
            "保持完全相同的像素画风格和分辨率。",

            # F3
            "请基于这张图片继续生成动画的下一帧。只做极微小的变化：\n"
            "1. 沙漏沙粒继续流动，位置再次微变\n"
            "2. 光源火焰向另一方向微倾\n"
            "3. 指南针指针微微回转\n"
            "其他所有内容必须完全保持不变。保持相同的像素画风格和分辨率。",

            # F4: loop
            "请基于这张图片生成动画的最后一帧，需要能和第一帧自然衔接循环。只做极微小的变化：\n"
            "1. 沙漏沙粒接近第一帧的状态\n"
            "2. 光源火焰回到接近中间位置\n"
            "3. 指南针指针回到接近第一帧的角度\n"
            "其他所有内容必须完全保持不变。保持相同的像素画风格和分辨率。",
        ],
    },
    "guild": {
        "source": BG_DIR / "bulletin-bg.png",
        "output_prefix": "guild",
        "frames": [
            # F2: lantern flames sway, chain slight movement
            "请基于这张像素风公会公告板图片生成动画的下一帧。只做极微小的变化：\n"
            "1. 两侧悬挂灯笼的火焰轻微向左摆动，光晕微变\n"
            "2. 灯笼的锁链有极轻微的摆动感\n"
            "3. 右侧墙壁蜡烛的火焰微微闪烁\n"
            "其他所有内容（公告板、纸张、墙面装饰位置）必须完全保持不变。\n"
            "保持完全相同的像素画风格和分辨率。",

            # F3
            "请基于这张图片继续生成动画的下一帧。只做极微小的变化：\n"
            "1. 灯笼火焰轻微向右摆动\n"
            "2. 锁链轻微回摆\n"
            "3. 蜡烛火焰变化\n"
            "其他所有内容必须完全保持不变。保持相同的像素画风格和分辨率。",

            # F4: loop
            "请基于这张图片生成动画的最后一帧，需要能和第一帧自然衔接循环。只做极微小的变化：\n"
            "1. 灯笼火焰回到接近中间位置\n"
            "2. 锁链静止\n"
            "3. 蜡烛火焰接近第一帧状态\n"
            "其他所有内容必须完全保持不变。保持相同的像素画风格和分辨率。",
        ],
    },
}


def launch_browser(pw):
    """Launch Chrome with cloned profile."""
    from gemini_generate import clone_chrome_profile

    print(f"Using profile: {PROFILE_DIR}")
    cookies_file = PROFILE_DIR / "Default" / "Cookies"
    if not cookies_file.exists():
        print("Cloning Chrome profile (first time)...")
        clone_chrome_profile()

    browser = pw.chromium.launch_persistent_context(
        user_data_dir=str(PROFILE_DIR),
        headless=False,
        channel="chrome",
        args=[
            "--disable-blink-features=AutomationControlled",
            "--no-first-run",
            "--no-default-browser-check",
        ],
        viewport={"width": 1280, "height": 900},
    )
    return browser


def wait_for_login(page):
    """Reuse from gemini_generate."""
    from gemini_generate import wait_for_login as _wfl
    _wfl(page)


def upload_image_and_prompt(page, image_path: Path, prompt: str, label: str):
    """Upload an image to Gemini and send a prompt in the same chat."""
    print(f"  [{label}] Uploading {image_path.name}...")

    # Click the upload button — aria-label varies by language
    upload_btn_selectors = [
        'button[aria-label*="開啟上傳檔案選單"]',    # 繁体
        'button[aria-label*="开启上传文件菜单"]',    # 简体
        'button[aria-label*="Open upload file menu"]',  # English
        'button[aria-label*="上傳"]',
        'button[aria-label*="上传"]',
        'button[aria-label*="Upload"]',
    ]
    clicked = False
    for sel in upload_btn_selectors:
        btn = page.locator(sel).first
        if btn.count() > 0 and btn.is_visible():
            btn.click()
            time.sleep(2)
            clicked = True
            print(f"  [{label}] Clicked upload menu button")
            break

    if not clicked:
        print(f"  [{label}] ✗ Cannot find upload button")
        page.screenshot(path=f"/tmp/gemini_anim_debug_{label}.png")
        return None

    # After clicking, a popup menu appears — click the file upload option
    upload_options = [
        'text=從電腦上傳',           # 繁体
        'text=从电脑上传',           # 简体
        'text=Upload from computer',
        'text=上傳檔案',
        'text=上传文件',
        'text=Upload file',
    ]
    for sel in upload_options:
        opt = page.locator(sel).first
        if opt.count() > 0 and opt.is_visible():
            opt.click()
            time.sleep(1)
            print(f"  [{label}] Clicked upload option")
            break

    # Now find the file input (should be available after clicking upload)
    time.sleep(1)
    file_input = page.locator('input[type="file"]')

    if file_input.count() == 0:
        print(f"  [{label}] ✗ Cannot find file input after clicking upload button")
        page.screenshot(path=f"/tmp/gemini_anim_debug_{label}.png")
        return None

    # Upload the image file
    file_input.first.set_input_files(str(image_path))
    print(f"  [{label}] Image uploaded, waiting for preview...")
    time.sleep(3)

    # Now type the prompt
    input_selectors = [
        'div[contenteditable="true"]',
        'rich-textarea [contenteditable="true"]',
        '.ql-editor',
        'textarea',
    ]
    input_box = None
    for sel in input_selectors:
        loc = page.locator(sel).first
        if loc.count() > 0:
            input_box = loc
            break

    if not input_box:
        print(f"  [{label}] ✗ Cannot find input box")
        return None

    input_box.click(timeout=10000)
    time.sleep(0.5)
    # Use keyboard typing for Chinese text (fill may not work well with CJK)
    input_box.fill(prompt, timeout=60000)
    time.sleep(0.5)

    # Send — click the send button (Enter may not work with image attachments)
    send_btns = [
        'button[aria-label*="傳送"]',          # 繁体: 傳送訊息
        'button[aria-label*="发送"]',          # 简体
        'button[aria-label*="Send"]',          # English
        'button[aria-label*="Submit"]',
    ]
    sent = False
    for sel in send_btns:
        btn = page.locator(sel).first
        if btn.count() > 0 and btn.is_visible():
            btn.click()
            sent = True
            break
    if not sent:
        # Fallback: try Enter
        page.keyboard.press("Enter")
    print(f"  [{label}] Prompt sent, waiting for generation (60-120s)...")

    # Wait for generated image
    return wait_for_generated_image(page, label)


def wait_for_generated_image(page, label: str, timeout_s: int = 180):
    """Wait for Gemini to generate an image and return its element."""
    img_patterns = [
        'img[src*="googleusercontent"]',
        'img[src*="lh3.google"]',
        'div[data-message-id] img[src^="https://"]',
        '.response-container img[src^="https://"]',
        '.model-response img[src^="https://"]',
    ]

    # Count existing images before generation
    existing_count = 0
    for pattern in img_patterns:
        existing_count += page.locator(pattern).count()

    for attempt in range(timeout_s // 2):
        for pattern in img_patterns:
            loc = page.locator(pattern)
            current_count = loc.count()
            if current_count > existing_count:
                # New image appeared
                img_element = loc.last
                if img_element.is_visible():
                    time.sleep(3)  # let it fully render
                    return img_element
        time.sleep(2)
        if attempt % 15 == 0 and attempt > 0:
            print(f"  [{label}] Still waiting... ({attempt * 2}s)")

    print(f"  [{label}] ✗ Timeout waiting for image")
    page.screenshot(path=f"/tmp/gemini_anim_timeout_{label}.png")
    return None


def download_image(page, img_element, output_path: Path, label: str) -> bool:
    """Download a generated image from Gemini."""
    img_src = img_element.get_attribute("src")
    if not img_src:
        print(f"  [{label}] ✗ No src attribute")
        return False

    response = page.request.get(img_src)
    if response.ok:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(response.body())
        print(f"  [{label}] ✓ Saved → {output_path}")
        return True

    # Fallback: JS fetch
    try:
        img_bytes = img_element.evaluate("""
            async (el) => {
                const resp = await fetch(el.src);
                const blob = await resp.blob();
                const buf = await blob.arrayBuffer();
                return Array.from(new Uint8Array(buf));
            }
        """)
        if img_bytes:
            with open(output_path, "wb") as f:
                f.write(bytes(img_bytes))
            print(f"  [{label}] ✓ Saved (JS fallback) → {output_path}")
            return True
    except Exception as e:
        print(f"  [{label}] ✗ Download failed: {e}")

    return False


def optimize_frame(path: Path, target_size=(1024, 572)):
    """Resize and optimize a generated frame to match target size."""
    try:
        from PIL import Image
        img = Image.open(path)
        if img.size != target_size:
            img = img.resize(target_size, Image.LANCZOS)
        img_p = img.convert("P", palette=Image.ADAPTIVE, colors=256)
        img_p.save(path, "PNG", optimize=True)
        size_kb = path.stat().st_size / 1024
        print(f"  [optimize] {path.name}: {img.size} → {size_kb:.0f}KB")
    except ImportError:
        print("  [optimize] Pillow not installed, skipping")


def animate_scene(page, scene_name: str):
    """Generate animation frames for a scene using chained Gemini prompts."""
    config = ANIM_PROMPTS[scene_name]
    source = config.get("source", config.get("fallback"))
    if "fallback" in config and not source.exists():
        source = config["fallback"]
    if not source.exists():
        print(f"✗ Source image not found: {source}")
        return False

    prefix = config["output_prefix"]
    prompts = config["frames"]
    n_frames = len(prompts) + 1  # +1 for original (F1)

    print(f"\n{'='*60}")
    print(f"Animating: {scene_name} ({n_frames} frames)")
    print(f"Source: {source}")
    print(f"{'='*60}")

    # F1 = original (copy to anim dir)
    ANIM_DIR.mkdir(parents=True, exist_ok=True)
    f1_path = ANIM_DIR / f"{prefix}-f1.png"
    if not f1_path.exists():
        import shutil
        shutil.copy2(str(source), str(f1_path))
        optimize_frame(f1_path)
    print(f"F1 (original): {f1_path}")

    # Start a fresh Gemini chat
    page.goto("https://gemini.google.com/app")
    page.wait_for_load_state("domcontentloaded")
    time.sleep(3)

    # Chain: upload F1 → generate F2, upload F2 → generate F3, etc.
    current_image = source  # start with original (high-res if available)
    generated_frames = [f1_path]

    for i, prompt in enumerate(prompts):
        frame_num = i + 2
        label = f"{scene_name}-F{frame_num}"
        output_path = ANIM_DIR / f"{prefix}-f{frame_num}.png"

        print(f"\n--- Frame {frame_num}/{n_frames} ---")

        img_element = upload_image_and_prompt(page, current_image, prompt, label)
        if not img_element:
            print(f"  [{label}] ✗ Generation failed, stopping chain")
            return False

        if not download_image(page, img_element, output_path, label):
            print(f"  [{label}] ✗ Download failed, stopping chain")
            return False

        optimize_frame(output_path)
        generated_frames.append(output_path)

        # Use this frame as input for the next one
        current_image = output_path

    print(f"\n✓ {scene_name}: {len(generated_frames)} frames generated")
    for f in generated_frames:
        size_kb = f.stat().st_size / 1024
        print(f"  {f.name} ({size_kb:.0f}KB)")

    return True


def main():
    what = sys.argv[1] if len(sys.argv) > 1 else "tavern"

    scenes = []
    if what == "all":
        scenes = list(ANIM_PROMPTS.keys())
    elif what in ANIM_PROMPTS:
        scenes = [what]
    else:
        print(f"Unknown scene: {what}")
        print(f"Valid: {', '.join(ANIM_PROMPTS.keys())}, all")
        return

    print(f"Will animate: {', '.join(scenes)}")
    print(f"Output: {ANIM_DIR}/")

    with sync_playwright() as p:
        browser = launch_browser(p)
        page = browser.pages[0] if browser.pages else browser.new_page()
        wait_for_login(page)

        success = 0
        for scene in scenes:
            if animate_scene(page, scene):
                success += 1

        print(f"\n{'='*60}")
        print(f"Done! {success}/{len(scenes)} scenes animated.")
        print(f"Frames in: {ANIM_DIR}/")
        browser.close()


if __name__ == "__main__":
    main()
