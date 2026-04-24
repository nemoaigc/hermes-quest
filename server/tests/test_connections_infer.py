"""Tests for server.connections_infer — run via:

    python -m unittest server.tests.test_connections_infer

No external deps (stdlib unittest).
"""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[1]
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

from connections_infer import infer_connections, jaccard  # noqa: E402


class JaccardTests(unittest.TestCase):
    def test_identical_sets(self):
        self.assertEqual(jaccard(["a", "b"], ["a", "b"]), 1.0)

    def test_disjoint_sets(self):
        self.assertEqual(jaccard(["a"], ["b"]), 0.0)

    def test_partial_overlap(self):
        self.assertAlmostEqual(jaccard(["a", "b", "c"], ["b", "c", "d"]), 0.5, places=5)

    def test_empty_on_one_side(self):
        self.assertEqual(jaccard([], ["a"]), 0.0)

    def test_deduplicates_within_set(self):
        self.assertEqual(jaccard(["a", "a", "b"], ["a", "b"]), 1.0)

    def test_ignores_blank_entries(self):
        self.assertEqual(jaccard(["a", "", "  "], ["a"]), 1.0)


class InferConnectionsTests(unittest.TestCase):
    def test_no_overlap_no_connections(self):
        workflows = [
            {"id": "alpha", "skills_involved": ["a", "b"]},
            {"id": "beta", "skills_involved": ["c", "d"]},
        ]
        self.assertEqual(infer_connections(workflows), [])

    def test_full_overlap_yields_strength_1(self):
        workflows = [
            {"id": "alpha", "skills_involved": ["a", "b"]},
            {"id": "beta", "skills_involved": ["a", "b"]},
        ]
        self.assertEqual(
            infer_connections(workflows),
            [{"from": "alpha", "to": "beta", "type": "complementary", "strength": 1.0}],
        )

    def test_below_min_overlap_dropped(self):
        # 1 shared / 10 union = 0.1 < 0.15 threshold
        workflows = [
            {"id": "a", "skills_involved": ["s1", "s2", "s3", "s4", "s5"]},
            {"id": "b", "skills_involved": ["s1", "x1", "x2", "x3", "x4"]},
        ]
        self.assertEqual(infer_connections(workflows), [])

    def test_at_or_above_min_overlap_kept(self):
        # 2 shared / 6 union ≈ 0.333
        workflows = [
            {"id": "a", "skills_involved": ["s1", "s2", "s3", "s4"]},
            {"id": "b", "skills_involved": ["s1", "s2", "x1", "x2"]},
        ]
        conns = infer_connections(workflows)
        self.assertEqual(len(conns), 1)
        self.assertEqual(conns[0]["from"], "a")
        self.assertEqual(conns[0]["to"], "b")
        self.assertEqual(conns[0]["type"], "complementary")
        self.assertAlmostEqual(conns[0]["strength"], 0.33, places=2)

    def test_chain_of_overlaps(self):
        workflows = [
            {"id": "frontend", "skills_involved": ["react", "css", "ui"]},
            {"id": "backend", "skills_involved": ["react", "api", "db"]},
            {"id": "devops", "skills_involved": ["api", "db", "deploy"]},
        ]
        conns = infer_connections(workflows)
        pairs = [f"{c['from']}->{c['to']}" for c in conns]
        self.assertEqual(pairs, ["backend->devops", "backend->frontend"])

    def test_output_is_sorted(self):
        workflows = [
            {"id": "c", "skills_involved": ["s1", "s2"]},
            {"id": "a", "skills_involved": ["s1", "s2"]},
            {"id": "b", "skills_involved": ["s1", "s2"]},
        ]
        conns = infer_connections(workflows)
        pairs = [f"{c['from']}->{c['to']}" for c in conns]
        self.assertEqual(pairs, ["a->b", "a->c", "b->c"])

    def test_workflows_without_skills_skipped(self):
        workflows = [
            {"id": "a", "skills_involved": []},
            {"id": "b", "skills_involved": ["s1"]},
            {"id": "c"},  # missing skills_involved entirely
        ]
        self.assertEqual(infer_connections(workflows), [])

    def test_duplicate_id_ignored(self):
        workflows = [
            {"id": "same", "skills_involved": ["s1"]},
            {"id": "same", "skills_involved": ["s1"]},
        ]
        self.assertEqual(infer_connections(workflows), [])

    def test_deterministic(self):
        workflows = [
            {"id": "alpha", "skills_involved": ["a", "b", "c"]},
            {"id": "beta", "skills_involved": ["b", "c", "d"]},
            {"id": "gamma", "skills_involved": ["a", "d"]},
        ]
        first = infer_connections(workflows)
        second = infer_connections(workflows)
        self.assertEqual(first, second)

    def test_does_not_mutate_input(self):
        workflows = [
            {"id": "a", "skills_involved": ["s1", "s2"]},
            {"id": "b", "skills_involved": ["s1", "s2"]},
        ]
        snapshot = json.dumps(workflows, sort_keys=True)
        infer_connections(workflows)
        self.assertEqual(json.dumps(workflows, sort_keys=True), snapshot)


if __name__ == "__main__":
    unittest.main()
