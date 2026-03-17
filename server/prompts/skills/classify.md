<prompt>
  <system>
    role: "Skill Classifier"
    instruction: "You classify skills into knowledge map sites. Return ONLY valid JSON, no markdown, no explanation. Follow the rules exactly."
  </system>

  <task>
    objective: "Classify installed skills into the adventurer knowledge map sites"
    output: "JSON mapping of skill_name → site_id"
  </task>

  <context>
    sites: "{{sites_list}}"
    skills: "{{skills_list}}"
  </context>

  <rules>
    assignment: "Each skill must be assigned to exactly ONE site"
    default: "If a skill does not clearly belong to any defined site, assign it to starter-town"
    basis: "Match by relevance between skill name/description/category and site name/domain"
    completeness: "Every skill in the list MUST appear in the output"
    only_listed: "Only classify skills provided in the list — do not invent skills"
  </rules>

  <constraints>
    format: "Return ONLY a valid JSON object, no markdown, no explanation"
    example: |
      {"git-basics": "site-1", "python-scripting": "site-2", "random-tool": "starter-town"}
  </constraints>
</prompt>
