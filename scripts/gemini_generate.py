"""
Generate pixel art assets via Gemini web UI using Playwright.
Uses a dedicated browser profile — first run requires manual Gemini login,
subsequent runs reuse the session automatically.

Usage:
  python gemini_generate.py login      # open browser to log in (first time)
  python gemini_generate.py test       # quick test with a simple prompt
  python gemini_generate.py map        # generate map background
  python gemini_generate.py bulletin   # generate bulletin board background
  python gemini_generate.py shop       # generate shop background
  python gemini_generate.py sprites    # generate continent + fog sprites
  python gemini_generate.py all        # generate everything
"""

import sys
import time
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

PROJECT_ROOT = Path(__file__).parent.parent
BG_DIR = PROJECT_ROOT / "public" / "bg"
SPRITE_DIR = PROJECT_ROOT / "public" / "sprites"

# Chrome's original profile and our cloned copy
CHROME_PROFILE = Path.home() / "Library" / "Application Support" / "Google" / "Chrome"
PROFILE_DIR = Path.home() / ".hermes-gemini-profile"

# ---- Prompts ----

MAP_BG_PROMPT = """Generate an image: a pixel art scene in 16-bit RPG style.

A dark wooden desk/table viewed from above, made of horizontal planks with rich wood grain texture. On the table lies a large aged parchment paper with burnt/stained darker edges. The parchment takes up the center ~70% of the frame.

The desk is covered with rich decorative items around the parchment:
- Top-left: an inkwell with quill feather pen, a small magnifying glass
- Bottom-left: another inkwell with quill, a rolled-up scroll tied with red ribbon
- Top-right: scattered gold and silver coins (5-6 coins), a small compass with brass rim
- Bottom-right: a thick leather-bound journal with gold clasp, a small wax seal stamp
- Scattered around: tiny map pins with colored heads, a small hourglass, candle wax drips

The parchment interior must be completely EMPTY — just clean aged paper with subtle coffee stains and creases. NO text, NO drawings, NO map lines anywhere on the parchment.

Style: 16-bit pixel art, warm color palette, fantasy RPG aesthetic. Wide landscape format (16:9 ratio)."""

BULLETIN_BG_PROMPT = """Generate a pixel art image. 16-bit pixel art with clean black outlines, warm brown/beige tones, visible square pixels, NO anti-aliasing, NO gradients. SNES RPG style.

Scene: A fantasy adventurer's guild wall. The wall is dark brown wooden planks with rich wood grain. A large cork bulletin board with thick dark wood frame and metal corner brackets takes up the center.

Pinned to the board are exactly 6 blank aged parchment notes in a 2-row x 3-column grid, evenly spaced, each held by a small brass pin. The parchments are light beige/cream colored with slightly burnt edges. The parchments must be completely BLANK — absolutely NO text, NO writing, NO letters, NO symbols drawn on them. Just plain aged paper.

Rich decorative details around the board:
- Two oil lanterns with warm orange glow hanging on chains on either side
- A crossed sword and shield mounted on the wall above the board
- Cobwebs in upper corners, a small spider
- A narrow wooden shelf below the board with scattered gold coins, a beer mug, and a small trophy/goblet
- On the wall to the left of the board: a small pixel art "wanted poster" pinned with a nail, showing a cartoon boy with a straw hat and a big goofy grin (Easter egg reference to Monkey D. Luffy from One Piece). The poster is slightly torn and tilted.
- A rope coil hanging on a nail below the wanted poster
- A small torch bracket on the far right wall

NO text anywhere in the image. Color palette: dark wood browns, warm parchment beige, brass gold, warm lantern orange.

Wide landscape format, 16:9 aspect ratio. High resolution."""

SHOP_BG_PROMPT = """Generate a pixel art image. 16-bit pixel art with clean black outlines, warm brown/beige tones, visible square pixels, NO anti-aliasing, NO gradients. SNES RPG style.

Scene: A fantasy RPG magic item shop interior viewed from the front. A large ornate wooden display cabinet fills the center with 3 columns × 3 rows = 9 equal compartments. Each compartment is currently EMPTY dark recessed wood.

Rich decorative details:
- The cabinet has elaborate carved trim with vine/leaf patterns along the top
- Stone wall visible behind, with magical rune symbols faintly glowing on stones
- Two candelabras with 3 candles each on either side, warm glow
- A brass weighing scale/balance on a small side table to the left
- Hanging dried herbs and potion bundles from the ceiling beams
- A crystal ball on a stand in the top-left corner, glowing faintly purple
- A small black cat sitting on the counter edge in the bottom-right
- Shelves of old books and scrolls flanking the main cabinet
- Small jars with colorful liquids on a windowsill

NO text anywhere in the image. Color palette: dark wood browns, warm highlights, brass gold, stone grey, subtle magic purple/cyan glows.

Wide landscape format, 16:9 aspect ratio. High resolution."""

NPC_BG_PROMPT = """Generate a pixel art image in 16-bit RPG style with clean black outlines, warm brown/beige/gold tones, visible square pixels, NO anti-aliasing, NO gradients.

Scene: A busy fantasy RPG tavern interior, viewed from the front. A long polished wooden bar counter stretches across the bottom third.

This is purely a tavern/bar — NO potions, NO maps, NO bulletin boards.

CHARACTERS (important — the tavern must look alive):
- A female bartender behind the counter, wiping a mug
- 2-3 adventurer silhouettes sitting at the bar on stools, chatting
- A hooded figure sitting alone in a dark corner with a drink
- Someone raising a beer mug in the background

Rich decorative details:
- Behind the counter: wooden shelves with ale barrels, wine bottles, beer mugs
- A large stone fireplace on the right with roaring fire, mounted deer antlers
- Wooden ceiling beams with a large iron chandelier holding many candles
- Hanging dried sausages and garlic braids from ceiling hooks
- Counter has beer mugs, plates of food, spilled coins
- A dartboard on the left wall
- Warm amber lighting throughout
- A sleeping dog near the fireplace

NO text anywhere. Warm, lively, bustling tavern atmosphere.

Color palette: dark wood browns, warm amber, candlelight yellow, stone grey, fireplace orange.

Wide landscape format, 16:9 aspect ratio. High resolution."""

SPRITE_PROMPTS = {
    "continent-software-engineering": """Generate a pixel art game sprite icon on a solid bright green (#00FF00) background.

The sprite is a small floating island continent for an RPG world map. It represents "Software Engineering": a rocky floating island with a glowing cyan crystal server tower on top, small pixel screens and blinking lights, tiny cable bridges. Color palette: cyan, teal, dark blue, grey stone.

Style: 32x32 pixel grid, each pixel clearly visible as a square, classic 16-bit SNES RPG style like Final Fantasy or Chrono Trigger world map icons. NO anti-aliasing, NO gradients, sharp pixel edges only. Square format.""",

    "continent-research-knowledge": """Generate a pixel art game sprite icon on a solid bright green (#00FF00) background.

The sprite is a small floating island continent for an RPG world map. It represents "Research & Knowledge": a rocky floating island with an ancient library tower, tiny scrolls scattered around, a glowing purple orb on top, small bookshelves visible. Color palette: purple, violet, gold, brown stone.

Style: 32x32 pixel grid, each pixel clearly visible as a square, classic 16-bit SNES RPG style like Final Fantasy or Chrono Trigger world map icons. NO anti-aliasing, NO gradients, sharp pixel edges only. Square format.""",

    "continent-automation-tools": """Generate a pixel art game sprite icon on a solid bright green (#00FF00) background.

The sprite is a small floating island continent for an RPG world map. It represents "Automation & Tools": a rocky floating island with mechanical gears, a small clockwork tower, tiny conveyor belts, steam pipes with pixel smoke puffs. Color palette: orange, amber, bronze, dark brown.

Style: 32x32 pixel grid, each pixel clearly visible as a square, classic 16-bit SNES RPG style like Final Fantasy or Chrono Trigger world map icons. NO anti-aliasing, NO gradients, sharp pixel edges only. Square format.""",

    "continent-creative-arts": """Generate a pixel art game sprite icon on a solid bright green (#00FF00) background.

The sprite is a small floating island continent for an RPG world map. It represents "Creative Arts": a rocky floating island with a rainbow crystal spire, tiny paint splashes in pixel form, small musical note particles floating around. Color palette: pink, magenta, rainbow accents, warm stone.

Style: 32x32 pixel grid, each pixel clearly visible as a square, classic 16-bit SNES RPG style like Final Fantasy or Chrono Trigger world map icons. NO anti-aliasing, NO gradients, sharp pixel edges only. Square format.""",

    "fog": """Generate a pixel art game sprite icon on a solid bright green (#00FF00) background.

The sprite is a mysterious fog cloud for an RPG world map, representing an undiscovered region. A swirling grey-brown mist cloud with a pixel art question mark "?" symbol in the center, small sparkle particles around edges.

Style: 32x32 pixel grid, each pixel clearly visible as a square, classic 16-bit SNES RPG style. NO anti-aliasing, NO gradients, sharp pixel edges only. Square format.""",
}


def postprocess_sprite(path: Path):
    """Remove green screen background and downscale sprite to 64x64."""
    try:
        from PIL import Image
    except ImportError:
        print(f"  [postprocess] Pillow not installed, skipping")
        return

    img = Image.open(path).convert("RGBA")
    data = img.load()
    w, h = img.size

    # Chroma-key: remove bright green (#00FF00) and nearby colors
    for y in range(h):
        for x in range(w):
            r, g, b, a = data[x, y]
            # Green screen: high green, low red and blue
            if g > 150 and r < 100 and b < 100:
                data[x, y] = (0, 0, 0, 0)
            # Also catch near-green with some tolerance
            elif g > 180 and (g - r) > 80 and (g - b) > 80:
                data[x, y] = (0, 0, 0, 0)

    # Downscale to 64x64 with nearest-neighbor for crisp pixels
    img = img.resize((64, 64), Image.NEAREST)
    img.save(path)
    print(f"  [postprocess] ✓ Green removed, scaled to 64x64")


def clone_chrome_profile():
    """Clone Chrome's login cookies/state to our profile dir."""
    import shutil

    src_default = CHROME_PROFILE / "Default"
    dst_default = PROFILE_DIR / "Default"

    if not src_default.exists():
        print(f"ERROR: Chrome profile not found: {src_default}")
        sys.exit(1)

    PROFILE_DIR.mkdir(parents=True, exist_ok=True)
    dst_default.mkdir(parents=True, exist_ok=True)

    # Copy only the essential login-related files (not the whole multi-GB profile)
    essential_files = [
        "Cookies",
        "Login Data",
        "Web Data",
        "Preferences",
        "Secure Preferences",
        "Local State",
    ]

    # Local State lives at Chrome root level
    local_state_src = CHROME_PROFILE / "Local State"
    local_state_dst = PROFILE_DIR / "Local State"
    if local_state_src.exists() and not local_state_dst.exists():
        shutil.copy2(str(local_state_src), str(local_state_dst))
        print(f"  Copied Local State")

    for fname in essential_files:
        src = src_default / fname
        dst = dst_default / fname
        if src.exists():
            shutil.copy2(str(src), str(dst))
            print(f"  Copied {fname}")

    # Also copy the -journal files if they exist
    for fname in essential_files:
        src = src_default / f"{fname}-journal"
        dst = dst_default / f"{fname}-journal"
        if src.exists():
            shutil.copy2(str(src), str(dst))

    print("✓ Profile cloned")


def launch_browser(pw):
    """Launch Chrome with cloned profile."""
    print(f"Using profile: {PROFILE_DIR}")

    # Clone Chrome's login state if our profile doesn't have cookies yet
    cookies_file = PROFILE_DIR / "Default" / "Cookies"
    if not cookies_file.exists():
        print("Cloning Chrome profile (first time)...")
        clone_chrome_profile()
    else:
        print("Using existing cloned profile")

    browser = pw.chromium.launch_persistent_context(
        user_data_dir=str(PROFILE_DIR),
        headless=False,
        channel="chrome",
        args=[
            "--disable-blink-features=AutomationControlled",
            "--no-first-run",
            "--no-default-browser-check",
        ],
        viewport={"width": 1280, "height": 800},
    )
    return browser


def wait_for_login(page):
    """Check if logged in; if not, wait for manual login."""
    page.goto("https://gemini.google.com/app")
    page.wait_for_load_state("domcontentloaded")
    time.sleep(3)

    # Check for login button (Chinese or English)
    login_selectors = [
        'a:has-text("登录")',
        'a:has-text("Sign in")',
        'a:has-text("Log in")',
    ]
    needs_login = False
    for sel in login_selectors:
        if page.locator(sel).count() > 0:
            needs_login = True
            break

    if needs_login:
        print("\n⚠ Not logged in to Gemini.")
        print("Please log in manually in the browser window.")
        print("Waiting for login (will auto-detect)...")
        # Poll until login button disappears
        for _ in range(300):  # wait up to 5 minutes
            time.sleep(2)
            still_login = False
            for sel in login_selectors:
                if page.locator(sel).count() > 0:
                    still_login = True
                    break
            if not still_login:
                break
        page.goto("https://gemini.google.com/app")
        page.wait_for_load_state("domcontentloaded")
        time.sleep(2)

    print("✓ Logged in to Gemini")


def generate_image(page, prompt: str, output_path: Path, label: str):
    """Send a prompt to Gemini and download the generated image."""
    print(f"\n[{label}] Sending prompt...")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Find and click the input area
    # Try multiple selectors for Gemini's input
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
        print(f"[{label}] ✗ Cannot find input box")
        page.screenshot(path=f"/tmp/gemini_debug_{label}.png")
        return False

    # Click and fill with retry
    for attempt in range(3):
        try:
            input_box.click(timeout=10000)
            time.sleep(1)
            input_box.fill(prompt, timeout=60000)
            time.sleep(0.5)
            break
        except Exception as e:
            if attempt < 2:
                print(f"[{label}] Input retry {attempt+1}...")
                time.sleep(3)
                # Re-find input box
                for sel in input_selectors:
                    loc = page.locator(sel).first
                    if loc.count() > 0:
                        input_box = loc
                        break
            else:
                print(f"[{label}] ✗ Cannot fill input after 3 attempts: {e}")
                return False

    # Press Enter to send
    page.keyboard.press("Enter")
    print(f"[{label}] Waiting for image generation (30-90s)...")

    try:
        # Wait for a generated image to appear
        # Try multiple patterns for how Gemini renders images
        img_patterns = [
            'div[data-message-id] img[src^="https://"]',
            '.response-container img[src^="https://"]',
            '.model-response img[src^="https://"]',
            'img[src*="googleusercontent"]',
            'img[src*="lh3.google"]',
        ]

        img_element = None
        for attempt in range(60):  # poll for up to 120 seconds
            for pattern in img_patterns:
                loc = page.locator(pattern).last
                if loc.count() > 0 and loc.is_visible():
                    img_element = loc
                    break
            if img_element:
                break
            time.sleep(2)

        if not img_element:
            print(f"[{label}] ✗ No image found after waiting")
            page.screenshot(path=f"/tmp/gemini_debug_{label}.png")
            print(f"[{label}] Debug screenshot: /tmp/gemini_debug_{label}.png")
            return False

        time.sleep(3)  # let it fully render

        # Get the image src
        img_src = img_element.get_attribute("src")
        if not img_src:
            print(f"[{label}] ✗ Image has no src attribute")
            return False

        print(f"[{label}] Found image, downloading...")

        # Try downloading via page context (shares cookies)
        response = page.request.get(img_src)
        if response.ok:
            with open(output_path, "wb") as f:
                f.write(response.body())
            print(f"[{label}] ✓ Saved → {output_path}")
            return True
        else:
            print(f"[{label}] ✗ Download failed: {response.status}")

            # Fallback: try right-click save approach using JS
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
                    print(f"[{label}] ✓ Saved (via JS fetch) → {output_path}")
                    return True
            except Exception as e2:
                print(f"[{label}] JS fetch fallback also failed: {e2}")

    except Exception as e:
        print(f"[{label}] ✗ Error: {e}")
        page.screenshot(path=f"/tmp/gemini_debug_{label}.png")
        print(f"[{label}] Debug screenshot: /tmp/gemini_debug_{label}.png")

    return False


def start_new_chat(page):
    """Navigate to a fresh Gemini chat."""
    page.goto("https://gemini.google.com/app")
    page.wait_for_load_state("domcontentloaded")
    time.sleep(2)


def main():
    what = sys.argv[1] if len(sys.argv) > 1 else "test"

    print(f"Profile dir: {PROFILE_DIR}")
    print("Launching Chrome...")

    with sync_playwright() as p:
        browser = launch_browser(p)
        page = browser.pages[0] if browser.pages else browser.new_page()

        # Login mode: just open browser for manual login
        if what == "login":
            wait_for_login(page)
            print("\n✓ Login saved! You can now close the browser and run generation commands.")
            print("Browser will stay open. Close the browser window manually when done.")
            try:
                # Keep alive until browser is closed by user
                while browser.pages:
                    time.sleep(1)
            except Exception:
                pass
            return

        # For all other modes, verify login first
        wait_for_login(page)

        # Build task list
        tasks = []
        if what in ("all", "map"):
            tasks.append(("map background", MAP_BG_PROMPT, BG_DIR / "map-bg.png"))
        if what in ("all", "bulletin"):
            tasks.append(("bulletin board", BULLETIN_BG_PROMPT, BG_DIR / "bulletin-bg.png"))
        if what in ("all", "shop"):
            tasks.append(("shop background", SHOP_BG_PROMPT, BG_DIR / "shop-bg.png"))
        if what in ("all", "npc"):
            tasks.append(("npc background", NPC_BG_PROMPT, BG_DIR / "npc-bg.png"))
        if what in ("all", "sprites"):
            for name, prompt in SPRITE_PROMPTS.items():
                tasks.append((f"sprite: {name}", prompt, SPRITE_DIR / f"{name}.png"))
        if what == "test":
            tasks.append((
                "test",
                "Generate an image of a pixel art golden coin, 16-bit RPG style, white background",
                Path("/tmp/gemini_test.png"),
            ))

        if not tasks:
            print(f"Unknown command: {what}")
            print("Valid: login, test, map, bulletin, shop, npc, sprites, all")
            browser.close()
            return

        print(f"\nGenerating {len(tasks)} image(s)...\n")

        success = 0
        for label, prompt, output in tasks:
            start_new_chat(page)
            if generate_image(page, prompt, output, label):
                # Post-process sprites (remove green bg, downscale)
                if "sprite" in label or label == "fog" or "continent" in str(output) or "fog" in str(output):
                    postprocess_sprite(output)
                success += 1

        print(f"\n✓ Done! {success}/{len(tasks)} images generated successfully.")
        browser.close()


if __name__ == "__main__":
    main()
