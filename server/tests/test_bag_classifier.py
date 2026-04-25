"""Tests for server.bag_classifier — run via:

    python -m unittest server.tests.test_bag_classifier

No external deps (stdlib unittest).
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

# Allow ``python -m unittest server.tests.test_bag_classifier`` from repo root.
SERVER_DIR = Path(__file__).resolve().parents[1]
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

from bag_classifier import (  # noqa: E402
    classify_completion,
    classify_rarity,
    classify_type,
    extract_brief,
    extract_rank,
)


class ExtractRankTests(unittest.TestCase):
    def test_standard_header(self):
        self.assertEqual(extract_rank("- rank: **A**\n"), "A")

    def test_case_insensitive(self):
        self.assertEqual(extract_rank("- rank: **s**"), "S")

    def test_no_asterisks(self):
        self.assertEqual(extract_rank("- rank: B"), "B")

    def test_missing(self):
        self.assertIsNone(extract_rank("no rank here"))

    def test_unknown_letter(self):
        self.assertIsNone(extract_rank("- rank: **Z**"))

    def test_empty(self):
        self.assertIsNone(extract_rank(""))


class ClassifyRarityTests(unittest.TestCase):
    def test_all_ranks_map_correctly(self):
        cases = {
            "S": "legendary",
            "A": "epic",
            "B": "rare",
            "C": "uncommon",
            "D": "common",
        }
        for letter, rarity in cases.items():
            with self.subTest(letter=letter):
                self.assertEqual(classify_rarity(f"- rank: **{letter}**"), rarity)

    def test_missing_rank_defaults_common(self):
        self.assertEqual(classify_rarity("no rank header"), "common")


class ExtractBriefTests(unittest.TestCase):
    def test_pulls_brief_section_body(self):
        md = "\n".join([
            "# Title",
            "",
            "- rank: **B**",
            "",
            "## Brief",
            "Simplify the status text.",
            "",
            "## Reflection",
            "Went well.",
        ])
        self.assertEqual(extract_brief(md), "Simplify the status text.")

    def test_falls_back_to_title(self):
        self.assertEqual(extract_brief("# Refactor the viewer"), "Refactor the viewer")

    def test_empty_input(self):
        self.assertEqual(extract_brief(""), "")


class ClassifyTypeTests(unittest.TestCase):
    def test_code_intent(self):
        self.assertEqual(
            classify_type("## Brief\nImplement the login flow", "login-flow"),
            ("code_snippet", "scroll"),
        )

    def test_fix_intent(self):
        t, _ = classify_type("## Brief\nFix the broken router", "router-bug")
        self.assertEqual(t, "code_snippet")

    def test_ui_intent(self):
        self.assertEqual(
            classify_type("## Brief\nRefine viewer loading feel", "refine-viewer"),
            ("training_report", "book"),
        )

    def test_design_intent(self):
        self.assertEqual(
            classify_type("## Brief\nDesign the plugin architecture", "plugin-arch"),
            ("map_fragment", "map"),
        )

    def test_research_intent(self):
        t, _ = classify_type("## Brief\nInvestigate the perf regression", "perf-invest")
        self.assertEqual(t, "research_note")

    def test_guide_intent(self):
        t, _ = classify_type("## Brief\nWrite a tutorial for new contributors", "tut")
        self.assertEqual(t, "book")

    def test_unmatched_fallback(self):
        self.assertEqual(
            classify_type("## Brief\nQuiet afternoon", "nothing"),
            ("research_note", "scroll"),
        )

    def test_matches_via_title_stem(self):
        t, _ = classify_type("", "refactor-the-world")
        self.assertEqual(t, "code_snippet")


class ClassifyCompletionTests(unittest.TestCase):
    def test_real_completion_ui_b_rank(self):
        md = "\n".join([
            "# Calm The Viewer Status Line",
            "",
            "- rank: **B**",
            "- workflow: viewer-forge",
            "",
            "## Brief",
            "Simplify the status text so it stays informative without pulling attention away from the image.",
        ])
        self.assertEqual(
            classify_completion(md, "calm-the-viewer-status-line"),
            {"type": "training_report", "rarity": "rare", "icon": "book"},
        )

    def test_real_completion_a_rank(self):
        md = "\n".join([
            "# Master: Autonomous Craft Loop",
            "",
            "- rank: **A**",
            "",
            "## Brief",
            "Push Autonomous Craft Loop to the next level.",
        ])
        result = classify_completion(md, "master-autonomous-craft-loop")
        self.assertEqual(result["rarity"], "epic")

    def test_empty_raw_returns_fallback(self):
        self.assertEqual(
            classify_completion("", "anything"),
            {"type": "research_note", "rarity": "common", "icon": "scroll"},
        )

    def test_idempotent(self):
        md = "# Fix the bug\n- rank: **C**\n## Brief\nFix the bug"
        a = classify_completion(md, "fix-bug")
        b = classify_completion(md, "fix-bug")
        self.assertEqual(a, b)


if __name__ == "__main__":
    unittest.main()
