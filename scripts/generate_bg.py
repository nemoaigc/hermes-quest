"""Generate high-res GUILD and SHOP backgrounds via Gemini, matching Map.png style."""

import asyncio
import sys
import os
from pathlib import Path

from gemini_webapi import GeminiClient

# Reuse cookies from generate_assets.py
from generate_assets import SECURE_1PSID, SECURE_1PSIDTS, ALL_COOKIES

PROJECT_ROOT = Path(__file__).parent.parent
BG_DIR = PROJECT_ROOT / "public" / "bg"

# Style reference: Map.png — warm wooden desk, parchment, ink bottles, quill pens,
# coins, leather journal. Clean black outlines, warm brown palette, 16-bit pixel art.

BULLETIN_PROMPT = """Generate a pixel art image in exactly the same style as a fantasy RPG game UI.

The style must match this EXACTLY: 16-bit pixel art with clean black outlines, warm brown/beige color palette, visible individual pixels, no anti-aliasing, no gradients — pure pixel art.

Scene: A wooden cork bulletin board mounted on a dark wooden wall. The board has a thick wooden frame with metal corner brackets. Pinned to the board are 6 blank aged parchment notes arranged in a neat 2-row × 3-column grid, each held by a small red or brass pin/tack. The parchments are slightly yellowed/aged but EMPTY (no text).

Two small oil lanterns with warm glow hang on either side of the board. A few cobwebs in the upper corners.

The wooden wall behind has horizontal plank texture matching a dark brown warm-toned wood, similar to an old tavern wall.

Color palette: dark browns (#3a2a1a, #5a3a1a), warm beige (#d4b896), aged parchment (#e8d5b0), brass/gold accents (#b8860b).

Wide landscape format, 16:9 aspect ratio. High resolution pixel art."""

SHOP_PROMPT = """Generate a pixel art image in exactly the same style as a fantasy RPG game UI.

The style must match this EXACTLY: 16-bit pixel art with clean black outlines, warm brown/beige color palette, visible individual pixels, no anti-aliasing, no gradients — pure pixel art.

Scene: A large wooden bookshelf/display cabinet viewed from the front, like a shopkeeper's shelf in an RPG item shop. The shelf has 4 rows and 3 columns = 12 compartments/cubbyholes. Each cubbyhole is an empty recessed wooden slot where items would be displayed.

The shelf is made of dark polished wood with decorative carved trim on top. The wood matches the warm brown tones of a fantasy tavern/shop. Small brass hooks and shelf labels at each slot.

A wooden "SHOP" sign hangs at the very top with pixel art lettering. Stone wall texture visible behind/around the shelf edges.

Color palette: dark browns (#3a2a1a, #5a3a1a), warm wood (#8b6a3c), brass/gold accents (#b8860b), stone grey (#5a5a5a).

Wide landscape format, 16:9 aspect ratio. High resolution pixel art."""


async def generate_and_save(client: GeminiClient, prompt: str, output_path: Path, label: str):
    print(f"  Generating {label}...")
    try:
        response = await client.generate_content(prompt)
        if response.images:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            img = response.images[0]
            await img.save(path=str(output_path.parent), filename=output_path.name, verbose=True)
            print(f"  ✓ Saved {label} → {output_path}")
            return True
        else:
            print(f"  ✗ No images returned for {label}")
            if response.text:
                print(f"    Response: {response.text[:500]}")
            return False
    except Exception as e:
        print(f"  ✗ Error generating {label}: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    what = sys.argv[1] if len(sys.argv) > 1 else "all"

    print("Initializing Gemini client...")
    proxy = os.environ.get("HTTPS_PROXY", None)
    client = GeminiClient(SECURE_1PSID, SECURE_1PSIDTS, proxy=proxy, cookies=ALL_COOKIES)
    await client.init(timeout=30, auto_close=False, close_delay=300, auto_refresh=True)
    print("✓ Client ready\n")

    if what in ("all", "bulletin"):
        print("[Bulletin Board Background]")
        await generate_and_save(client, BULLETIN_PROMPT, BG_DIR / "bulletin-bg.png", "bulletin board")

    if what in ("all", "shop"):
        print("\n[Shop Background]")
        await generate_and_save(client, SHOP_PROMPT, BG_DIR / "shop-bg.png", "shop background")

    print("\n✓ Done!")


if __name__ == "__main__":
    asyncio.run(main())
