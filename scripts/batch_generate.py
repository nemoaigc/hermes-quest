"""
Batch generate skill/item icons via Gemini 5×5 grid + two-pass watermark removal.
Usage:
  python batch_generate.py skills        # All 4 continent skill sheets
  python batch_generate.py items         # All 4 item category sheets
  python batch_generate.py continents    # 5 continent sprites
  python batch_generate.py all           # Everything
"""
import sys
import time
import json
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).parent))
from gemini_generate import launch_browser, wait_for_login, start_new_chat, generate_image

OUTPUT_DIR = Path(__file__).parent.parent / "public"
SKILLS_DIR = OUTPUT_DIR / "skills"
ITEMS_DIR = OUTPUT_DIR / "items"

STYLE = "16-bit pixel art with clean black outlines, warm brown/gold tones, visible square pixels. Each icon on aged parchment background."
GRID_INSTRUCTION = "The image contains exactly 25 icons in a 5-row × 5-column grid. Each icon is in its own clearly bordered square cell separated by thick dark brown lines. NO text in any cell."

# ===================== SKILL DEFINITIONS =====================

SKILL_SHEETS = {
    "software-engineering": {
        "desc": "Software Engineering skill icons",
        "skills": [
            "Python snake coiled around a code scroll",
            "JavaScript yellow lightning bolt shield",
            "TypeScript blue diamond with TS rune",
            "React spinning blue atom symbol",
            "Node.js green hexagonal gem",
            "SQL golden database cylinder with query scroll",
            "Git branching tree with red nodes",
            "Docker blue whale carrying containers",
            "API golden key with gear teeth",
            "Testing green checkmark on a shield",
            "CI/CD circular arrows with green pipe",
            "Debug magnifying glass over a red bug",
            "Refactor golden wrench reshaping code blocks",
            "Code Review eye symbol with golden frame",
            "Architecture blueprint scroll with castle towers",
            "Performance lightning bolt through hourglass",
            "Security padlock with shield emblem",
            "GraphQL pink diamond with connected nodes",
            "Redis red crystal cube",
            "Kubernetes blue ship wheel helm",
            "Terraform purple crystal infrastructure blocks",
            "WebSocket two arrows connecting in a circle",
            "OAuth golden token with key hole",
            "Microservices cluster of small connected cubes",
            "Database golden cylinder with sparkle",
        ],
    },
    "research-knowledge": {
        "desc": "Research & Knowledge skill icons",
        "skills": [
            "Literature Review open book with magnifying glass",
            "Data Analysis bar chart crystal ball",
            "Academic Writing quill pen on paper",
            "Statistics bell curve on parchment",
            "Hypothesis lightbulb with question mark",
            "Experiment flask with bubbling potion",
            "Survey clipboard with checkboxes",
            "Taxonomy tree diagram with labels",
            "Synthesis two potions merging into one",
            "Critical Thinking brain with gears",
            "Citation chain links on a scroll",
            "Peer Review two magnifying glasses crossing",
            "Methodology compass rose on paper",
            "Ethics scales of justice",
            "Visualization colorful prism splitting light",
            "NLP speech bubble with neural pattern",
            "Machine Learning gear with brain symbol",
            "Deep Learning layered neural network",
            "Fine-tuning wrench adjusting a crystal",
            "Prompt Engineering magic wand with text scroll",
            "RAG book connected to crystal orb",
            "Embedding geometric shapes clustering",
            "Classification sorting arrows into boxes",
            "Clustering connected dots in groups",
            "Evaluation star rating on shield",
        ],
    },
    "automation-tools": {
        "desc": "Automation & Tools skill icons",
        "skills": [
            "Shell Script terminal window with green text",
            "Cron Jobs clock with circular arrows",
            "Web Scraping spider web catching data",
            "Browser Automation puppet strings on browser",
            "Pipeline connected pipe segments with flow",
            "Monitoring eye on dashboard screen",
            "Deploy rocket launching upward",
            "Config sliders and toggle switches",
            "Integration puzzle pieces connecting",
            "Workflow flowchart arrows on board",
            "Task Queue conveyor belt with boxes",
            "Scheduling calendar with clock overlay",
            "CLI Tools hammer and chisel",
            "MCP Server crystal server tower with plug",
            "API Wrapper gift box around a gear",
            "File Processing folder with spinning gear",
            "PDF red document with seal stamp",
            "Email envelope with wing feathers",
            "Notification bell with sparkle",
            "Backup shield with copy arrows",
            "Migration bird carrying data box",
            "Load Test weight scale with arrow gauge",
            "Proxy mask with network arrows",
            "DNS globe with address labels",
            "SSL padlock with certificate ribbon",
        ],
    },
    "creative-arts": {
        "desc": "Creative Arts skill icons",
        "skills": [
            "Writing feather quill with ink splash",
            "Drawing pencil with rainbow trail",
            "Pixel Art tiny grid with colored squares",
            "Music golden lyre with notes floating",
            "UI/UX layout wireframe with golden ratio",
            "Storytelling open book with characters jumping out",
            "Poetry rose with ink drops",
            "Animation film strip with movement lines",
            "Video camera with play button crystal",
            "Photography camera lens with light rays",
            "Branding crown stamp with seal",
            "Typography letter A with decorative serifs",
            "Color Theory color wheel palette",
            "Layout grid with golden proportions",
            "Poster scroll with star burst",
            "Presentation easel with chart",
            "Infographic data icons flowing together",
            "Icon Design tiny shield with pixel detail",
            "Game Design dice with sword",
            "Sound Design waveform with speaker",
            "Motion Graphics spinning star particles",
            "3D Modeling cube with wireframe edges",
            "Calligraphy brush with flowing ink",
            "Origami folded paper crane",
            "Meme Creation laughing mask with speech bubble",
        ],
    },
}

# ===================== ITEM DEFINITIONS =====================

ITEM_SHEETS = {
    "scrolls": {
        "desc": "Scroll & Document items",
        "items": [
            "Ancient research scroll tied with red ribbon",
            "Tutorial parchment with wax seal",
            "Error log scroll with red warning marks",
            "API documentation scroll with golden edges",
            "Bug report scroll with squashed bug stamp",
            "Meeting notes scroll with ink spots",
            "Code review scroll with checkmarks",
            "Deploy log scroll with rocket emblem",
            "Security audit scroll with lock seal",
            "Performance report scroll with lightning bolt",
            "Architecture diagram scroll with blueprint lines",
            "Test results scroll with green badges",
            "Migration guide scroll with arrow marks",
            "Changelog scroll with version numbers",
            "Incident report scroll with fire mark",
            "Design spec scroll with ruler marks",
            "User story scroll with stick figure",
            "Sprint recap scroll with circular arrows",
            "Knowledge base scroll with brain emblem",
            "Tutorial series scroll with numbered steps",
            "Cheat sheet scroll folded in quarters",
            "Quick reference scroll with bookmark tabs",
            "Field notes scroll with compass mark",
            "Lab journal scroll with flask emblem",
            "Expedition log scroll with footprint marks",
        ],
    },
    "books": {
        "desc": "Book & Tome items",
        "items": [
            "Python grimoire with snake emblem",
            "JavaScript spellbook with lightning cover",
            "React tome with atom symbol",
            "Docker manual with whale cover",
            "Git survival guide with branch diagram",
            "SQL cookbook with golden database",
            "Algorithm textbook with tree diagrams",
            "Design patterns book with geometric shapes",
            "Clean code tome with sparkle",
            "Security handbook with padlock cover",
            "AI fundamentals book with brain cover",
            "Data science journal with chart cover",
            "DevOps field manual with gear cover",
            "Cloud architecture tome with cloud symbol",
            "Testing playbook with shield cover",
            "API design guide with key emblem",
            "Performance tuning manual with speedometer",
            "Networking primer with web diagram",
            "Cryptography codex with cipher symbols",
            "Machine learning workbook with neural pattern",
            "System design bible thick golden spine",
            "Open source manifesto with open hand",
            "Startup handbook with rocket cover",
            "Debugging detective guide with magnifying glass",
            "Legacy code survival guide with cobweb cover",
        ],
    },
    "potions-gems": {
        "desc": "Potion & Gem items",
        "items": [
            "Red health potion bottle",
            "Blue mana potion bottle",
            "Green stamina potion bottle",
            "Purple focus potion bottle",
            "Golden XP boost potion",
            "Orange creativity elixir",
            "Silver speed potion",
            "Pink inspiration potion with heart bubbles",
            "Cyan debug potion with bug dissolving",
            "Yellow energy drink bottle",
            "Ruby gem glowing red",
            "Sapphire gem glowing blue",
            "Emerald gem glowing green",
            "Amethyst gem glowing purple",
            "Diamond gem prismatic sparkle",
            "Topaz gem glowing amber",
            "Opal gem rainbow shimmer",
            "Onyx gem dark with gold veins",
            "Pearl white with soft glow",
            "Crystal shard jagged with energy",
            "Ancient coin with mysterious rune",
            "Golden key with ornate handle",
            "Silver compass pointing north",
            "Bronze medal with star",
            "Enchanted ring with glowing stone",
        ],
    },
    "equipment": {
        "desc": "Equipment & Tool items",
        "items": [
            "Wooden training sword",
            "Iron coding dagger",
            "Crystal staff with orb",
            "Leather developer gloves",
            "Steel debugging hammer",
            "Bronze automation wrench",
            "Silver analysis monocle",
            "Golden architect compass",
            "Mithril keyboard gauntlets",
            "Dragon scale firewall shield",
            "Enchanted USB amulet",
            "Runic hard drive relic",
            "Phoenix feather stylus pen",
            "Void cloak of stealth mode",
            "Crown of system admin",
            "Boots of rapid deployment",
            "Belt of infinite storage",
            "Cape of error handling",
            "Helmet of focus mode",
            "Bracelet of version control",
            "Quiver of shortcut arrows",
            "Map fragment with dotted trail",
            "Torn treasure map piece",
            "Compass of code navigation",
            "Lantern of dark mode",
        ],
    },
}


def build_prompt(title: str, items: list[str], grid: str = "5×5") -> str:
    rows, cols = [int(x) for x in grid.split("×")]
    total = rows * cols
    items_desc = "\n".join(f"{i+1}. {item}" for i, item in enumerate(items[:total]))
    return f"""Generate a single pixel art image. {STYLE}

{GRID_INSTRUCTION.replace("25", str(total)).replace("5-row × 5-column", f"{rows}-row × {cols}-column")}

Theme: {title}
The {total} icons from left-to-right, top-to-bottom:
{items_desc}

Each icon should be a clear recognizable pixel art object/symbol. Warm fantasy RPG aesthetic. Square format image."""


def build_prompt_pass2(title: str, last_item: str, remaining_items: list[str]) -> str:
    """Second pass: put the last item first to get a clean version."""
    reordered = [last_item] + remaining_items[:24]
    return build_prompt(title, reordered)


def split_grid(img_path: Path, names: list[str], output_dir: Path, grid: str = "5×5"):
    """Split a grid image into individual icons."""
    rows, cols = [int(x) for x in grid.split("×")]
    img = Image.open(img_path)
    w, h = img.size
    cell_w = w // cols
    cell_h = h // rows

    output_dir.mkdir(parents=True, exist_ok=True)
    results = []

    for idx, name in enumerate(names):
        if idx >= rows * cols:
            break
        row = idx // cols
        col = idx % cols
        left = col * cell_w
        top = row * cell_h
        cell = img.crop((left, top, left + cell_w, top + cell_h))
        safe_name = name.lower().replace(" ", "-").replace("/", "-").replace("&", "and")[:40]
        out_path = output_dir / f"{safe_name}.png"
        cell.save(out_path)
        results.append(out_path)

    return results


def generate_sheet(page, prompt: str, output_path: Path, label: str) -> bool:
    """Generate one grid sheet via Gemini."""
    start_new_chat(page)
    return generate_image(page, prompt, output_path, label)


def run_skill_generation(page):
    """Generate all skill icon sheets."""
    print("\n" + "=" * 60)
    print("SKILL ICONS — 4 continents × 25 = 100 icons")
    print("=" * 60)

    raw_dir = SKILLS_DIR / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    for continent_id, data in SKILL_SHEETS.items():
        skills = data["skills"]
        label = f"skills-{continent_id}"

        # Pass 1: generate full 5×5 grid
        prompt1 = build_prompt(data["desc"], skills)
        out1 = raw_dir / f"{continent_id}-pass1.png"
        print(f"\n[{label}] Pass 1: generating 5×5 grid...")
        if generate_sheet(page, prompt1, out1, f"{label}-p1"):
            # Split pass 1: positions 0-23 are clean (24th may have watermark)
            clean_icons = split_grid(out1, skills[:24], SKILLS_DIR / continent_id)
            print(f"  → {len(clean_icons)} clean icons saved")

            # Pass 2: put 25th skill first
            prompt2 = build_prompt_pass2(data["desc"], skills[24], skills[:24])
            out2 = raw_dir / f"{continent_id}-pass2.png"
            print(f"  Pass 2: getting clean version of icon #25...")
            if generate_sheet(page, prompt2, out2, f"{label}-p2"):
                # Extract just the first cell (which is the 25th skill, now clean)
                img2 = Image.open(out2)
                w, h = img2.size
                cell = img2.crop((0, 0, w // 5, h // 5))
                safe = skills[24].lower().replace(" ", "-").replace("/", "-")[:40]
                cell.save(SKILLS_DIR / continent_id / f"{safe}.png")
                print(f"  → Icon #25 saved clean")
        else:
            print(f"  ✗ Failed to generate {label}")


def run_item_generation(page):
    """Generate all item icon sheets."""
    print("\n" + "=" * 60)
    print("ITEM ICONS — 4 categories × 25 = 100 icons")
    print("=" * 60)

    raw_dir = ITEMS_DIR / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    for cat_id, data in ITEM_SHEETS.items():
        items = data["items"]
        label = f"items-{cat_id}"

        prompt1 = build_prompt(data["desc"], items)
        out1 = raw_dir / f"{cat_id}-pass1.png"
        print(f"\n[{label}] Pass 1: generating 5×5 grid...")
        if generate_sheet(page, prompt1, out1, f"{label}-p1"):
            clean_icons = split_grid(out1, items[:24], ITEMS_DIR / cat_id)
            print(f"  → {len(clean_icons)} clean icons saved")

            prompt2 = build_prompt_pass2(data["desc"], items[24], items[:24])
            out2 = raw_dir / f"{cat_id}-pass2.png"
            print(f"  Pass 2: getting clean version of icon #25...")
            if generate_sheet(page, prompt2, out2, f"{label}-p2"):
                img2 = Image.open(out2)
                w, h = img2.size
                cell = img2.crop((0, 0, w // 5, h // 5))
                safe = items[24].lower().replace(" ", "-").replace("/", "-")[:40]
                cell.save(ITEMS_DIR / cat_id / f"{safe}.png")
                print(f"  → Icon #25 saved clean")
        else:
            print(f"  ✗ Failed to generate {label}")


def main():
    what = sys.argv[1] if len(sys.argv) > 1 else "all"

    with sync_playwright() as p:
        browser = launch_browser(p)
        page = browser.pages[0] if browser.pages else browser.new_page()
        wait_for_login(page)

        if what in ("all", "skills"):
            run_skill_generation(page)

        if what in ("all", "items"):
            run_item_generation(page)

        browser.close()

    # Summary
    skill_count = sum(1 for _ in SKILLS_DIR.rglob("*.png") if "raw" not in str(_))
    item_count = sum(1 for _ in ITEMS_DIR.rglob("*.png") if "raw" not in str(_))
    print(f"\n{'='*60}")
    print(f"DONE! Skills: {skill_count}, Items: {item_count}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
