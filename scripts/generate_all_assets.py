"""
Batch-generate all pixel art assets via Gemini Playwright automation.
Matching the Map.png reference style: 16-bit pixel art, clean black outlines,
warm brown/gold/beige palette, SNES RPG aesthetic.

Usage:
  python generate_all_assets.py npc-bg         # NPC tavern background
  python generate_all_assets.py portraits       # 3 NPC portraits
  python generate_all_assets.py continents      # 4 continent sprites + fog
  python generate_all_assets.py map-bg          # map background (like Map.png)
  python generate_all_assets.py all             # everything
"""

import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

PROJECT_ROOT = Path(__file__).parent.parent
BG_DIR = PROJECT_ROOT / "public" / "bg"
NPC_DIR = PROJECT_ROOT / "public" / "npc"
SPRITE_DIR = PROJECT_ROOT / "public" / "sprites"

PROFILE_DIR = Path.home() / ".hermes-gemini-profile"

STYLE_PREFIX = """The art style must be: 16-bit pixel art with clean black outlines, warm brown/beige/gold color palette, visible square pixels, NO anti-aliasing, NO smooth gradients. Classic SNES RPG aesthetic matching a fantasy tavern/adventure guild theme."""

# ---- Map Background (matching Map.png style exactly) ----
MAP_BG_PROMPT = f"""Generate a pixel art image. {STYLE_PREFIX}

Scene: A dark wooden table/desk viewed from above. The table is made of horizontal wooden planks with visible wood grain, warm brown tones. On the table lies a large piece of aged parchment paper — light beige/cream colored with burnt/stained darker edges. The parchment takes up most of the frame but leaves dark wood visible around all edges.

Decorative items on the wood table around the parchment:
- Top-left corner: a pixel art inkwell (dark blue-grey stone) with a white quill feather pen
- Bottom-left corner: another inkwell with quill
- Right side: scattered gold and silver coins (4-5 coins)
- Bottom-right corner: a small leather-bound journal/book with gold clasp

At the top center of the parchment: a decorative banner/ribbon scroll. The banner should be EMPTY (no text).

The parchment interior should be completely EMPTY — just clean aged paper with subtle coffee stains and creases. No map content, no text, no markings.

Color palette: dark wood (#3a2a1a, #5a3a1a), parchment (#e8d5b0, #d4b896), gold coins (#daa520, #ffd700), ink blue-grey (#4a5a6a).

Wide landscape format, 16:9 aspect ratio. High resolution."""

# ---- NPC Tavern Background ----
NPC_BG_PROMPT = f"""Generate a pixel art image. {STYLE_PREFIX}

Scene: Interior of a fantasy RPG adventurer's tavern, viewed from behind the counter looking outward. A long wooden bar counter stretches across the bottom third. Behind the counter (close to viewer): wooden shelves with potion bottles, mugs, and a keg. The tavern hall beyond has warm candlelight, wooden beams on the ceiling, a stone fireplace on one wall.

Three distinct empty spots along the counter where NPC characters would stand — left, center, and right positions, each with a small lantern nearby.

Warm amber lighting throughout. The atmosphere is cozy and inviting.

Color palette: dark wood browns (#3a2a1a, #5a3a1a, #8b6a3c), warm amber (#d4a050), candlelight yellow (#f0e68c), stone grey.

Wide landscape format, 16:9 aspect ratio. High resolution."""

# ---- NPC Portraits (bust/face, square format) ----
PORTRAIT_PROMPTS = {
    "guild-master": f"""Generate a pixel art character portrait. {STYLE_PREFIX}

A fantasy RPG Guild Master bust portrait (head and upper shoulders only). He is a stern but wise middle-aged man with:
- A small golden crown or circlet on his head
- A thick brown handlebar mustache
- Sharp determined eyes
- Heavy gold/brown plate armor on shoulders with a medal/emblem
- Warm skin tone

Background: solid dark brown (#1a140c) or transparent.
Square format. The face should be detailed and expressive, filling most of the frame. Resolution: 128x128 pixels or similar.""",

    "cartographer": f"""Generate a pixel art character portrait. {STYLE_PREFIX}

A fantasy RPG Cartographer/Scholar bust portrait (head and upper shoulders only). He is an elderly wise man with:
- A blue beret or scholar's cap
- Round wire-frame spectacles/glasses
- A thin grey beard
- Gentle intelligent eyes
- A dark blue scholarly robe with a scroll pin on the collar

Background: solid dark brown (#1a140c) or transparent.
Square format. The face should be detailed and expressive, filling most of the frame. Resolution: 128x128 pixels or similar.""",

    "quartermaster": f"""Generate a pixel art character portrait. {STYLE_PREFIX}

A fantasy RPG Quartermaster/Merchant bust portrait (head and upper shoulders only). He is a jovial stocky middle-aged man with:
- A wide-brimmed brown leather hat
- Rosy cheeks and a friendly grin
- A thick neck
- A beige/cream shopkeeper's apron over a green tunic
- A small pouch or coin bag visible at the collar area

Background: solid dark brown (#1a140c) or transparent.
Square format. The face should be detailed and expressive, filling most of the frame. Resolution: 128x128 pixels or similar.""",
}

# ---- Continent Sprites ----
CONTINENT_PROMPTS = {
    "continent-software-engineering": f"""Generate a pixel art game icon sprite. {STYLE_PREFIX}

A small floating island/continent for an RPG world map representing "Software Engineering". A rocky floating landmass with:
- A glowing cyan crystal tower on top (like a server/data center)
- Tiny pixel screens and blinking indicator lights
- Small cable bridges connecting mini-structures
- Rocky base with floating debris underneath

Color accent: cyan/teal (#00CED1, #008B8B) on warm brown rock base.
Solid bright green (#00FF00) background for chroma-key removal.
Square format, centered composition.""",

    "continent-research-knowledge": f"""Generate a pixel art game icon sprite. {STYLE_PREFIX}

A small floating island/continent for an RPG world map representing "Research & Knowledge". A rocky floating landmass with:
- An ancient library tower with a glowing purple orb at the peak
- Tiny scrolls and bookshelves visible through windows
- A small telescope or observatory dome
- Rocky base with floating pages underneath

Color accent: purple/violet (#9370DB, #6A0DAD) on warm brown rock base.
Solid bright green (#00FF00) background for chroma-key removal.
Square format, centered composition.""",

    "continent-automation-tools": f"""Generate a pixel art game icon sprite. {STYLE_PREFIX}

A small floating island/continent for an RPG world map representing "Automation & Tools". A rocky floating landmass with:
- Mechanical gears and a clockwork tower
- Tiny conveyor belts and robotic arms
- Steam pipes with small pixel smoke puffs
- Bronze/copper machinery visible

Color accent: orange/amber (#FF8C00, #CD853F) on warm brown rock base.
Solid bright green (#00FF00) background for chroma-key removal.
Square format, centered composition.""",

    "continent-creative-arts": f"""Generate a pixel art game icon sprite. {STYLE_PREFIX}

A small floating island/continent for an RPG world map representing "Creative Arts". A rocky floating landmass with:
- A rainbow crystal spire at the center
- Tiny paint splashes and color palettes
- Musical note particles floating around
- A small stage or amphitheater carved into the rock

Color accent: pink/magenta (#FF69B4, #DA70D6) with rainbow accents on warm brown rock base.
Solid bright green (#00FF00) background for chroma-key removal.
Square format, centered composition.""",

    "fog": f"""Generate a pixel art game icon sprite. {STYLE_PREFIX}

A mysterious fog/cloud patch for an RPG world map representing an undiscovered region:
- Swirling grey-brown mist cloud
- A pixel art question mark "?" symbol in the center
- Small sparkle particles around edges
- Ethereal and mysterious feeling

Colors: grey (#808080), brown mist (#8B7355), with subtle gold sparkles.
Solid bright green (#00FF00) background for chroma-key removal.
Square format, centered composition.""",
}


def postprocess_sprite(path: Path):
    """Remove green screen background and resize sprite."""
    try:
        from PIL import Image
    except ImportError:
        print(f"  [postprocess] Pillow not installed, skipping")
        return

    img = Image.open(path).convert("RGBA")
    data = img.load()
    w, h = img.size

    for y in range(h):
        for x in range(w):
            r, g, b, a = data[x, y]
            if g > 150 and r < 100 and b < 100:
                data[x, y] = (0, 0, 0, 0)
            elif g > 180 and (g - r) > 80 and (g - b) > 80:
                data[x, y] = (0, 0, 0, 0)

    img = img.resize((64, 64), Image.NEAREST)
    img.save(path)
    print(f"  [postprocess] green removed, scaled to 64x64")


def launch_browser(pw):
    return pw.chromium.launch_persistent_context(
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


def wait_for_login(page):
    page.goto("https://gemini.google.com/app")
    page.wait_for_load_state("domcontentloaded")
    time.sleep(3)
    for sel in ['a:has-text("登录")', 'a:has-text("Sign in")', 'a:has-text("Log in")']:
        if page.locator(sel).count() > 0:
            print("⚠ Not logged in. Waiting for manual login...")
            for _ in range(300):
                time.sleep(2)
                still = False
                for s2 in ['a:has-text("登录")', 'a:has-text("Sign in")', 'a:has-text("Log in")']:
                    if page.locator(s2).count() > 0:
                        still = True
                        break
                if not still:
                    break
            page.goto("https://gemini.google.com/app")
            page.wait_for_load_state("domcontentloaded")
            time.sleep(2)
            break
    print("✓ Logged in")


def start_new_chat(page):
    page.goto("https://gemini.google.com/app")
    page.wait_for_load_state("domcontentloaded")
    time.sleep(2)


def generate_image(page, prompt: str, output_path: Path, label: str):
    print(f"\n[{label}] Sending prompt...")
    output_path.parent.mkdir(parents=True, exist_ok=True)

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
        return False

    input_box.click()
    time.sleep(0.5)
    input_box.fill(prompt)
    time.sleep(0.5)
    page.keyboard.press("Enter")
    print(f"[{label}] Waiting for generation...")

    try:
        img_patterns = [
            'div[data-message-id] img[src^="https://"]',
            '.response-container img[src^="https://"]',
            '.model-response img[src^="https://"]',
            'img[src*="googleusercontent"]',
            'img[src*="lh3.google"]',
        ]

        img_element = None
        for attempt in range(90):
            for pattern in img_patterns:
                loc = page.locator(pattern).last
                if loc.count() > 0 and loc.is_visible():
                    img_element = loc
                    break
            if img_element:
                break
            time.sleep(2)

        if not img_element:
            print(f"[{label}] ✗ No image found")
            page.screenshot(path=f"/tmp/gemini_debug_{label}.png")
            return False

        time.sleep(3)
        img_src = img_element.get_attribute("src")
        if not img_src:
            return False

        response = page.request.get(img_src)
        if response.ok:
            with open(output_path, "wb") as f:
                f.write(response.body())
            print(f"[{label}] ✓ Saved → {output_path}")
            return True
        else:
            # JS fallback
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
                    print(f"[{label}] ✓ Saved (JS) → {output_path}")
                    return True
            except Exception as e2:
                print(f"[{label}] ✗ Fallback failed: {e2}")

    except Exception as e:
        print(f"[{label}] ✗ Error: {e}")
        page.screenshot(path=f"/tmp/gemini_debug_{label}.png")

    return False


def main():
    what = sys.argv[1] if len(sys.argv) > 1 else "all"

    tasks = []

    if what in ("all", "map-bg"):
        tasks.append(("map-bg", MAP_BG_PROMPT, BG_DIR / "map-bg.png", False))

    if what in ("all", "npc-bg"):
        tasks.append(("npc-bg", NPC_BG_PROMPT, BG_DIR / "npc-bg.png", False))

    if what in ("all", "portraits"):
        for name, prompt in PORTRAIT_PROMPTS.items():
            tasks.append((f"portrait-{name}", prompt, NPC_DIR / f"{name}.png", False))

    if what in ("all", "continents"):
        for name, prompt in CONTINENT_PROMPTS.items():
            tasks.append((f"sprite-{name}", prompt, SPRITE_DIR / f"{name}.png", True))

    if not tasks:
        print(f"Unknown: {what}. Use: map-bg, npc-bg, portraits, continents, all")
        return

    print(f"Will generate {len(tasks)} image(s): {[t[0] for t in tasks]}\n")

    with sync_playwright() as p:
        browser = launch_browser(p)
        page = browser.pages[0] if browser.pages else browser.new_page()
        wait_for_login(page)

        success = 0
        for label, prompt, output, is_sprite in tasks:
            start_new_chat(page)
            if generate_image(page, prompt, output, label):
                if is_sprite:
                    postprocess_sprite(output)
                success += 1

        print(f"\n✓ Done! {success}/{len(tasks)} generated.")
        browser.close()


if __name__ == "__main__":
    main()
