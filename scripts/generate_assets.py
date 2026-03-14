"""Generate pixel art assets for Hermes Quest Dashboard using Gemini Imagen."""

import asyncio
import sys
import os
from pathlib import Path

from gemini_webapi import GeminiClient

# Cookie credentials
SECURE_1PSID = "g.a0007gjgKnbeWR4s9ee6mWZtGqIC8kc7MsdPGf7hkVASdlpUrEUYd-afMwHr6MfvurOHmlFNlwACgYKAeQSARASFQHGX2MiBShy3jRAev9meaUV96cjkxoVAUF8yKoEbJWjWw6XBUbG8DnTKL750076"
SECURE_1PSIDTS = "sidts-CjEBBj1CYqD5CLdj2nvKB1uBxjwWkwuy-dr00Uu0sGFpGtzE_GdzW6cIFzwSlaPzsaD_EAA"

ALL_COOKIES = {
    "__Secure-1PSID": SECURE_1PSID,
    "__Secure-1PSIDTS": SECURE_1PSIDTS,
    "__Secure-1PSIDCC": "AKEyXzXgJsH9bFHB3TyVH1KLL4nKbBlqr52LcUYTBHHmjTXfsBvao5-H8zIkhesdj2EdhnLD8A",
    "__Secure-1PAPISID": "vFElN3bxGe9DBUVl/ApA5boSCt0R8bBeai",
    "__Secure-3PSID": "g.a0007gjgKnbeWR4s9ee6mWZtGqIC8kc7MsdPGf7hkVASdlpUrEUYUdo-cwhIx_X3xCuYmTzIHwACgYKAeMSARASFQHGX2MilMRnml2DNNQ9YDgfNtrvtBoVAUF8yKp5p8Rvj0xC-yrTZomCADb-0076",
    "__Secure-3PSIDCC": "AKEyXzUeqy5crgodUS0NPVcXy4uJqPJGBqyQQ9WgTghzXZUlq5yGGa03f5WfShez6zoyiMuXoDo",
    "__Secure-3PSIDTS": "sidts-CjEBBj1CYqD5CLdj2nvKB1uBxjwWkwuy-dr00Uu0sGFpGtzE_GdzW6cIFzwSlaPzsaD_EAA",
    "__Secure-3PAPISID": "vFElN3bxGe9DBUVl/ApA5boSCt0R8bBeai",
    "SAPISID": "vFElN3bxGe9DBUVl/ApA5boSCt0R8bBeai",
    "APISID": "0fWmEj6hPJ8E_-PK/AJeHEaBg1vw-gvZD5",
    "HSID": "AUWQD9k1rkPUcut3V",
    "NID": "529=UTT2n5zOeX-bN2dYc4IYykIIS5R_QBhIELg7XUrVdMGxBEreJeXptL6cJevVf6arg2rKT5gYi7X8b3GKaKa-qF406KBtxUtn6-xFIZf1vIiiu13oxXXvnsegee1Pc2RaPiL1VqSpk1PlAmXv8nrlSRnAX-cIb1GDr5DDqMZcNBLLWOhNOsAvBGFa5uCa9N9fcw03nuxdoEpGNysdVjn3QvbpAXj9snf0lJkk5QtyvaeiQBdUdwLDCm1OobCyZR4oyllqy64b6_khhHf65gCTv3xBzBMBYcdMFL-nPXpbalMZ1jKN1Vu8z44QPWj3MHmvxIW8m9MBgrxGhfw2FSNLbCZlL0W7U_W7REcxPdmBRbsffGNGQgDwBL4rj8TJjNtaNpJbntueDSp1i0iH4r9RuiMr-V9pI8OVFNrLLqxKMTr-NdjZsFYJ1EB_hQc3plqkys-0SPb3kknY2yGvILqI1ZC2ET4vHhyxNIHaG9wJPn6RWytf1xqx4pddtBm48YGewqw2Q4x9kMAzPlsqLOwpecrbHKsndYxb_F7r87Ag8nk81yY7HOyX3ua_wNVY6DnBW15FM_Z82gM-WTaCPb0u6k69fxrU2nbHIW_-i8XOrnOzIbyjczIor3SKR7pXjmmBH19Uh_zZEv-U6zi8EzGM5DLjxiQrWw60GCeK7K2gPyeK6-i4SAduNpmRlwtbVv715LC3pdp3t8AR9bSGwbaC8MLPAS-Svq2EoTkQZlwjDNixaDjGNmB7WsNSPPX_w8Tv-63zKtFAm5HDYkU4_KAhge4lrMynwXBffNGV92sK6MKxnfL1F-rnfNAFzlU2frrO1HPvztX2D5RJQq793AweZAVVmuqtBEn69bfWfV-kqq8n5UtzT9Gr6NckiALs3J-UXTVcwxVfmHc4rgKOdUslF_mTm01-2jOSTWPrZQDav3KLuCKGw_yCaIdmRGRIWnxIq0ajDSLL0cV9kPG95HFBulZQ42k7xizm1jgQcmq8qxyeBczA2O7HfIOWrkxNSXf20XABBQxuq-HsE5x8XmdOLzMo9Srd-IIoQgVaHPmJWf1UIZLSbumi5I0z95muL1SR0CHtOs3p4PumBXCApeDnY_tjYO14JCWOcCss4Zi8TH-VEtVG3oHzXzzgI4eNgKH7lwy78kOzeXdsGp8-Gc7CzqvZ-YdlmjeH4xl7Y8aFsNc-3eTOMT--hqKLGLp5riu2_uyhoMStYgwfndGOul9xJz7bYSrp7Vy0xVvk6xMEthBonmxTyZazQzZTRjk8TayYfXKhQ8bzDkAm6wNr4taAREVVeGD9fd0Dg3_WTquAvsByVsqjQCs6hNMDKF8w04SddpOQtVLFny7cDxB4eWGGpJjTMNvS4FRbm7aHgjuRZCuwo7xi5xJ1_bys_cKa6YQrkTe9Xs55kHl1Zckb2mhBlX2BFZo",
    "GOOGLE_ABUSE_EXEMPTION": "ID=cc7e3068e4c657af:TM=1773391549:C=>:IP=142.249.36.172-:S=2jTdU4d_lCV3o8RA1PB6tA",
}

# Output paths
PROJECT_ROOT = Path(__file__).parent.parent
BG_DIR = PROJECT_ROOT / "public" / "bg"
SPRITE_DIR = PROJECT_ROOT / "public" / "sprites"

# ---- Prompts ----

MAP_BG_PROMPT = """Generate an image: a pixel art scene in 16-bit RPG style, exactly matching this description:

A dark wooden table with visible horizontal plank texture and wood grain. On top of the table lies a large piece of aged parchment paper (light beige/cream color) with burnt/stained darker edges. The parchment takes up most of the frame but leaves wood visible around all edges.

Decorative items on the wood table around the parchment:
- Top-left and bottom-left: pixel art inkwell with quill feather pen
- Right side: scattered gold and silver coins (3-4 coins)
- Bottom-right corner: a leather-bound book with gold clasp

At the top of the parchment, a banner/ribbon with text area (leave it blank or with minimal text).

The parchment interior should be EMPTY (no map content) - just clean aged paper with subtle stains and creases.

Style: 16-bit pixel art, warm color palette, fantasy RPG aesthetic. Resolution: 800x500 pixels. The image should look like a game UI background."""

BULLETIN_BG_PROMPT = """Generate a pixel art scene in 16-bit RPG style:

A wooden bulletin board mounted on a stone/wood wall. The board has a dark wood frame with metal corner brackets.

Pinned to the board are exactly 6 blank parchment papers/notes arranged in a 3x2 grid (3 columns, 2 rows), evenly spaced. Each parchment is held by a small pin/tack at the top. The parchments are slightly different sizes and angles for a natural look, but clearly arranged in a grid pattern.

The parchment papers should be EMPTY (no text) - just aged paper texture.

Around the board edges: a small lantern on one side, maybe some cobwebs in corners.

Style: 16-bit pixel art, warm fantasy RPG tavern aesthetic. Resolution: 800x500 pixels."""

SHOP_BG_PROMPT = """Generate a pixel art scene in 16-bit RPG style:

A wooden shop shelf/cabinet viewed from the front. The shelf has 3 rows and 4 columns = 12 equal compartments/slots. Each slot is a recessed wooden compartment, currently EMPTY.

The shelf is made of dark polished wood with decorative carvings on the top frame. Small labels or price tags hang from each shelf edge.

At the top, a wooden sign saying "SHOP" in pixel art lettering.

The background behind/around the shelf shows stone wall texture.

Style: 16-bit pixel art, warm fantasy RPG shop aesthetic. Resolution: 800x500 pixels."""

CONTINENT_PROMPTS = {
    "software-engineering": "A pixel art small floating island/landmass shaped like a circuit board or code terminal, with tiny towers and glowing screens. Colors: cyan/teal tones. 16-bit RPG style, transparent background, 100x100 pixels.",
    "research-knowledge": "A pixel art small floating island/landmass shaped like an open book or library tower, with tiny scrolls and a magnifying glass. Colors: purple/violet tones. 16-bit RPG style, transparent background, 100x100 pixels.",
    "automation-tools": "A pixel art small floating island/landmass shaped like a gear/mechanical structure, with tiny robots and conveyor belts. Colors: orange/amber tones. 16-bit RPG style, transparent background, 100x100 pixels.",
    "creative-arts": "A pixel art small floating island/landmass shaped like a painter's palette or music stage, with tiny brushes and musical notes. Colors: pink/magenta tones. 16-bit RPG style, transparent background, 100x100 pixels.",
}

FOG_PROMPT = "A pixel art mysterious fog/cloud patch with question mark, swirling mist with subtle sparkles. Colors: grey/brown muted tones. 16-bit RPG style, transparent background, 80x80 pixels."


async def generate_and_save(client: GeminiClient, prompt: str, output_path: Path, label: str):
    """Generate an image and save it."""
    print(f"  Generating {label}...")
    try:
        response = await client.generate_content(prompt)
        if response.images:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            img = response.images[0]
            await img.save(path=str(output_path.parent), filename=output_path.name, verbose=True)
            print(f"  ✓ Saved {label} → {output_path}")
        else:
            print(f"  ✗ No images returned for {label}")
            if response.text:
                print(f"    Response text: {response.text[:300]}")
    except Exception as e:
        print(f"  ✗ Error generating {label}: {e}")
        import traceback
        traceback.print_exc()


async def main():
    what = sys.argv[1] if len(sys.argv) > 1 else "all"

    print("Initializing Gemini client...")
    proxy = os.environ.get("HTTPS_PROXY", None)
    client = GeminiClient(SECURE_1PSID, SECURE_1PSIDTS, proxy=proxy, cookies=ALL_COOKIES)
    await client.init(timeout=30, auto_close=False, close_delay=300, auto_refresh=True)
    print("✓ Client ready\n")

    if what in ("all", "map"):
        print("[Map Background]")
        await generate_and_save(client, MAP_BG_PROMPT, BG_DIR / "map-bg.png", "map background")

    if what in ("all", "bulletin"):
        print("\n[Bulletin Board Background]")
        await generate_and_save(client, BULLETIN_BG_PROMPT, BG_DIR / "bulletin-bg.png", "bulletin board")

    if what in ("all", "shop"):
        print("\n[Shop Background]")
        await generate_and_save(client, SHOP_BG_PROMPT, BG_DIR / "shop-bg.png", "shop background")

    if what in ("all", "sprites"):
        print("\n[Continent Sprites]")
        for cid, prompt in CONTINENT_PROMPTS.items():
            await generate_and_save(client, prompt, SPRITE_DIR / f"continent-{cid}.png", f"continent: {cid}")

        print("\n[Fog Sprite]")
        await generate_and_save(client, FOG_PROMPT, SPRITE_DIR / "fog.png", "fog")

    print("\n✓ Done!")


if __name__ == "__main__":
    asyncio.run(main())
