"""LLM-based skill classification for Hermes Quest sites."""
import asyncio
import json
import logging
import sys
from pathlib import Path

logger = logging.getLogger(__name__)

MAP_FILE = Path.home() / ".hermes" / "quest" / "knowledge-map.json"

# Lock to prevent concurrent reclassifications from stomping each other
_classify_lock = asyncio.Lock()


def _get_classify_client():
    """Get OpenAI client for classification, avoiding jiter version conflicts."""
    agent_paths = [p for p in sys.path if "hermes-agent" in p and "site-packages" in p]
    for p in agent_paths:
        sys.path.remove(p)

    jiter_mods = [k for k in sys.modules if k.startswith("jiter")]
    for k in jiter_mods:
        sys.modules.pop(k)

    try:
        agent_dir = str(Path.home() / ".hermes" / "hermes-agent")
        if agent_dir not in sys.path:
            sys.path.insert(0, agent_dir)

        from hermes_cli.auth import resolve_codex_runtime_credentials
        creds = resolve_codex_runtime_credentials()
        base_url = creds.get("base_url", "").rstrip("/")
        api_key = creds.get("api_key", "")
        if not base_url or not api_key:
            return None

        import httpx
        from openai import AsyncOpenAI
        http_client = httpx.AsyncClient(proxy="http://127.0.0.1:7890")
        client = AsyncOpenAI(api_key=api_key, base_url=base_url, http_client=http_client)
        return client, http_client
    except Exception as e:
        logger.error(f"Failed to get classify client: {e}")
        return None
    finally:
        for p in agent_paths:
            if p not in sys.path:
                sys.path.append(p)


def _try_parse_json(raw: str) -> dict | None:
    """Try multiple strategies to parse JSON from LLM output."""
    import re
    # Strategy 1: direct parse
    try:
        result = json.loads(raw)
        if isinstance(result, dict):
            return result
    except Exception:
        pass
    # Strategy 2: extract from markdown code fence
    md_match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", raw)
    if md_match:
        try:
            result = json.loads(md_match.group(1))
            if isinstance(result, dict):
                return result
        except Exception:
            pass
    # Strategy 3: find outermost braces
    json_match = re.search(r"\{[\s\S]*\}", raw)
    if json_match:
        text = json_match.group()
        try:
            result = json.loads(text)
            if isinstance(result, dict):
                return result
        except Exception:
            pass
        # Strategy 4: fix trailing commas
        fixed = re.sub(r",\s*([}\]])", r"\1", text)
        try:
            result = json.loads(fixed)
            if isinstance(result, dict):
                return result
        except Exception:
            pass
    return None


async def classify_skills_to_sites(skills: list, sites: list, model: str) -> dict:
    """Use LLM to classify skills into sites. Returns {skill_name: site_id}."""
    # Build the set of all real skill names upfront
    all_skill_names = {s["name"] for s in skills if s.get("name") and s["name"].strip()}
    
    skill_lines = []
    for s in skills:
        desc = s.get('description', s.get('category', 'general'))
        if desc:
            desc = desc[:120]
        skill_lines.append(f"- {s['name']}: {desc}")
    skills_str = "\n".join(skill_lines)

    site_lines = []
    for s in sites:
        if s.get('defined'):
            site_lines.append(f"- {s['id']} ({s['name']}): domain={s.get('domain', 'general')}")
    sites_str = "\n".join(site_lines)

    prompt = (
        "Classify each skill into the most appropriate site. "
        "Return ONLY a JSON object mapping skill_name to site_id.\n\n"
        f"SITES:\n{sites_str}\n\n"
        f"SKILLS:\n{skills_str}\n\n"
        "Rules:\n"
        "- Each skill goes to exactly ONE site\n"
        "- If unclear, assign to \"starter-town\"\n"
        "- Match by domain relevance (skill category/description vs site domain)\n"
        "- Return ALL skills, not just a subset\n\n"
        "Return ONLY valid JSON like: {\"skill-name\": \"site-id\", ...}"
    )

    llm_result = {}
    try:
        result = _get_classify_client()
        if not result:
            raise RuntimeError("Codex client not available")
        client, http_client = result
        try:
            sys_instruction = "You classify skills into sites. Return ONLY valid JSON, no markdown fences. Include ALL skills."
            try:
                _tmpl = (Path(__file__).parent / "prompts" / "skills" / "classify.md").read_text()
                import re as _re
                _m = _re.search(r'instruction:\s*"([^"]+)"', _tmpl)
                if _m: sys_instruction = _m.group(1)
            except Exception: pass
            stream = await client.responses.create(
                model=model,
                instructions=sys_instruction,
                input=[{"role": "user", "content": prompt}],
                store=False,
                stream=True,
            )
            reply_parts = []
            async for event in stream:
                if hasattr(event, "type"):
                    if event.type == "response.output_text.delta":
                        reply_parts.append(event.delta)
                    elif event.type == "response.completed":
                        break
            raw = "".join(reply_parts).strip()
        finally:
            await http_client.aclose()

        parsed = _try_parse_json(raw)
        if parsed and isinstance(parsed, dict):
            valid_ids = {s["id"] for s in sites if s.get("defined")}
            for skill_name, site_id in parsed.items():
                if not skill_name or not skill_name.strip():
                    continue
                # Only include skills that actually exist
                if skill_name in all_skill_names:
                    llm_result[skill_name] = site_id if site_id in valid_ids else "starter-town"
            logger.info(f"LLM returned {len(parsed)} entries, {len(llm_result)} matched real skills")
        else:
            logger.warning(f"Could not parse LLM response as JSON (length={len(raw)})")
    except Exception as e:
        logger.error(f"Skill classification LLM call failed: {e}")

    # Build final result: LLM results + fill missing with starter-town
    final = {}
    filled_count = 0
    for name in all_skill_names:
        if name in llm_result:
            final[name] = llm_result[name]
        else:
            final[name] = "starter-town"
            filled_count += 1
    
    logger.info(f"Classification result: {len(final)} total ({len(llm_result)} from LLM, {filled_count} defaulted to starter-town)")
    return final


async def reclassify_skills_after_site_change(sites: list, model: str, broadcast_fn=None):
    """Reclassify all skills after a site is added or removed."""
    async with _classify_lock:
        try:
            # Broadcast classification started
            if broadcast_fn:
                try: await broadcast_fn({"type": "classify_status", "status": "started"})
                except: pass
            
            import sqlite3
            from config import DB_PATH
            db = sqlite3.connect(str(DB_PATH))
            db.row_factory = sqlite3.Row
            rows = db.execute("SELECT name, category, description FROM skills WHERE name IS NOT NULL AND TRIM(name) != ''").fetchall()
            db.close()
            skills = [
                {"name": r["name"], "category": r["category"], "description": r["description"] or ""}
                for r in rows
                if r["name"] and r["name"].strip()
            ]

            if not skills:
                logger.info("No skills to classify")
                return

            defined_sites = [s for s in sites if s.get("defined")]
            if len(defined_sites) <= 1:
                classification = {s["name"]: "starter-town" for s in skills}
                logger.info(f"Only default site remains, assigning all {len(skills)} skills to starter-town")
            else:
                classification = await classify_skills_to_sites(skills, sites, model)

            # Verify all skills are accounted for
            skill_names = {s["name"] for s in skills}
            classified_names = set(classification.keys())
            missing = skill_names - classified_names
            if missing:
                logger.warning(f"{len(missing)} skills missing from classification, adding to starter-town: {missing}")
                for name in missing:
                    classification[name] = "starter-town"

            # Update knowledge-map.json
            if MAP_FILE.exists():
                km = json.loads(MAP_FILE.read_text())

                site_to_workflow = {}
                for s in sites:
                    if s.get("workflow_id"):
                        site_to_workflow[s["id"]] = s["workflow_id"]

                # Clear all workflow skills first
                for wf in km.get("workflows", []):
                    wf["skills_involved"] = []

                # Assign skills based on classification
                unplaced = []
                for skill_name, site_id in classification.items():
                    if not skill_name or not skill_name.strip():
                        continue
                    wf_id = site_to_workflow.get(site_id)
                    if wf_id:
                        wf = next((w for w in km["workflows"] if w["id"] == wf_id), None)
                        if wf:
                            wf["skills_involved"].append(skill_name)
                        else:
                            unplaced.append(skill_name)
                    else:
                        unplaced.append(skill_name)
                
                # Put all unplaced skills in starter-town
                if unplaced:
                    starter = next((w for w in km["workflows"] if w["id"] == "starter-town"), None)
                    if starter:
                        starter["skills_involved"].extend(unplaced)
                        logger.info(f"{len(unplaced)} skills placed in Starter Town (no matching workflow)")

                # Sort and deduplicate, filter empties
                for wf in km.get("workflows", []):
                    wf["skills_involved"] = sorted(set(s for s in wf.get("skills_involved", []) if s and s.strip()))

                # Final verification
                total_in_map = sum(len(wf.get("skills_involved", [])) for wf in km["workflows"])
                if total_in_map != len(skills):
                    logger.warning(f"Skill count mismatch: {total_in_map} in map vs {len(skills)} in DB")

                # Re-derive inter-workflow connections from the freshly
                # populated skills_involved. Without this the SubRegionGraph
                # panel renders isolated nodes.
                from connections_infer import infer_connections
                connections = infer_connections(km.get("workflows", []))
                km["connections"] = connections
                logger.info(f"Inferred {len(connections)} inter-workflow connection(s)")

                MAP_FILE.write_text(json.dumps(km, indent=2))

            logger.info(f"Reclassified {len(skills)} skills into {len(defined_sites)} sites")
            
            # Broadcast completion
            if broadcast_fn:
                try:
                    await broadcast_fn({"type": "classify_status", "status": "completed", "count": len(skills)})
                    state_path = Path.home() / ".hermes" / "quest" / "state.json"
                    if state_path.exists():
                        state = json.loads(state_path.read_text())
                        await broadcast_fn({"type": "state", "data": state})
                except: pass
            if broadcast_fn:
                try: await broadcast_fn({"type": "skills_reclassified", "count": len(skills)})
                except: pass
        except Exception as e:
            logger.error(f"Skill reclassification error: {e}")
            import traceback
            logger.error(traceback.format_exc())
