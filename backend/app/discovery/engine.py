import datetime
import logging
from typing import List, Dict, Any, Tuple
from app.schemas.discovery import UserPreferences, RepoSearchResult, MatchExplanation, DiscoveryResponse
from app.github.client import github_client
from app.cache.redis_client import cache_service

logger = logging.getLogger("oss_compass.discovery")

# Known public GSoC participating organizations and projects
KNOWN_GSOC_ORGS = {
    "python", "django", "pallets", "scikit-learn", "numpy", "sympy", "pandas-dev",
    "apache", "mozilla", "cncf", "kubernetes", "prometheus", "envoyproxy",
    "zulip", "jenkins-infra", "postmanlabs", "owasp", "matrix-org", "fossasia",
    "wikimedia", "videolan", "blender", "inkscape", "godotengine", "qemu",
    "cern", "haiku", "oppia", "sugarlabs", "freecad", "gnome", "kde"
}

class DiscoveryEngine:
    def _build_search_query(self, prefs: UserPreferences) -> str:
        query_parts = []
        
        # Languages filter
        if prefs.languages:
            lang_filters = [f"language:{lang.lower()}" for lang in prefs.languages[:2]]
            query_parts.append(" ".join(lang_filters))
        
        # Primary interest / topic (only 1 to avoid over-constraining AND queries)
        if prefs.interests and len(prefs.interests) > 0:
            query_parts.append(f"topic:{prefs.interests[0].lower().replace(' ', '-')}")
            
        # Stars bounds based on experience level
        if prefs.experience_level == "beginner":
            query_parts.append("stars:15..30000")
        elif prefs.experience_level == "intermediate":
            query_parts.append("stars:50..60000")
        else:
            query_parts.append("stars:>200")
            
        # Ensure repo is active and not archived
        query_parts.append("archived:false")

        return " ".join(query_parts) if query_parts else "stars:>100 archived:false"

    def _calculate_score(self, repo: Dict[str, Any], prefs: UserPreferences) -> Tuple[int, MatchExplanation]:
        score = 0
        matched_skills = []
        reasons_for_fit = []
        potential_challenges = []
        
        repo_owner = repo.get("owner", {}).get("login", "").lower()
        repo_name = repo.get("name", "").lower()
        repo_desc = (repo.get("description") or "").lower()
        repo_topics = [t.lower() for t in repo.get("topics", [])]
        primary_lang = (repo.get("language") or "").lower()
        
        # 1. Language alignment (up to 35 pts)
        if prefs.languages:
            pref_langs_lower = [l.lower() for l in prefs.languages]
            if primary_lang in pref_langs_lower:
                score += 35
                matched_skills.append(repo.get("language", ""))
                reasons_for_fit.append(f"Primary language is {repo.get('language')}, directly matching your profile.")
            else:
                # Partial match in topics or description
                matched_in_topics = [l for l in prefs.languages if l.lower() in repo_topics or l.lower() in repo_desc]
                if matched_in_topics:
                    score += 20
                    matched_skills.extend(matched_in_topics)
                    reasons_for_fit.append(f"Uses {', '.join(matched_in_topics)} in documentation/components.")
                else:
                    potential_challenges.append(f"Written primarily in {repo.get('language') or 'other languages'}.")
        else:
            score += 20  # Neutral if no language restriction
            
        # 2. Frameworks & Tools alignment (up to 20 pts)
        if prefs.frameworks:
            matched_fw = [fw for fw in prefs.frameworks if fw.lower() in repo_topics or fw.lower() in repo_desc or fw.lower() in repo_name]
            if matched_fw:
                score += 20
                matched_skills.extend(matched_fw)
                reasons_for_fit.append(f"Explicitly tags {', '.join(matched_fw)}.")
                
        # 3. Experience level & Community friendliness (up to 25 pts)
        open_issues = repo.get("open_issues_count", 0)
        has_issues_enabled = repo.get("has_issues", True)
        
        if prefs.experience_level == "beginner":
            if open_issues > 5:
                score += 15
                reasons_for_fit.append(f"Has {open_issues} open issues providing contribution opportunities.")
            else:
                potential_challenges.append("Few open issues available.")
                
            if repo.get("stargazers_count", 0) < 10000:
                score += 10
                reasons_for_fit.append("Moderate codebase size suitable for initial orientation.")
            else:
                potential_challenges.append("Large community size; reviews may have stricter SLA standards.")
        else:
            score += 20
            
        # 4. GSoC affiliation (up to 10 bonus pts)
        is_gsoc = repo_owner in KNOWN_GSOC_ORGS or any(org in repo_topics for org in KNOWN_GSOC_ORGS)
        if is_gsoc:
            score += 10
            reasons_for_fit.append(f"Affiliated with known GSoC organization ({repo_owner.upper()}).")
            if prefs.gsoc_interest:
                score += 5
                
        # 5. Activity & freshness (up to 10 pts)
        pushed_at = repo.get("pushed_at", "")
        if pushed_at:
            score += 10
            reasons_for_fit.append("Actively maintained with recent commits.")
            
        # Clamp score between 10 and 100
        final_score = min(100, max(15, score))
        
        explanation = MatchExplanation(
            score=final_score,
            matched_skills=list(set(matched_skills)),
            reasons_for_fit=reasons_for_fit,
            potential_challenges=potential_challenges,
            is_gsoc_affiliated=is_gsoc
        )
        return final_score, explanation

    async def search(self, prefs: UserPreferences) -> DiscoveryResponse:
        cache_key = f"discovery:{hash(str(prefs.model_dump()))}"
        cached = await cache_service.get_json(cache_key)
        if cached:
            return DiscoveryResponse(**cached)

        query = self._build_search_query(prefs)
        logger.info(f"Executing GitHub repo discovery query: '{query}'")
        
        try:
            raw_res = await github_client.search_repositories(query=query, sort="updated", order="desc", per_page=12)
        except Exception as e:
            logger.warning(f"Targeted search failed: {e}. Executing fallback popular search.")
            raw_res = {}

        items = raw_res.get("items", [])

        # If zero items found with specific topic filters, gracefully broaden by language & stars
        if not items and prefs.languages:
            lang = prefs.languages[0].lower()
            broad_query = f"language:{lang} stars:>50 archived:false"
            logger.info(f"Targeted query yielded 0 items. Broadening discovery query to: '{broad_query}'")
            try:
                raw_res = await github_client.search_repositories(query=broad_query, sort="stars", order="desc", per_page=12)
                items = raw_res.get("items", [])
            except Exception as e:
                logger.error(f"Broadened search failed: {e}")
        ranked_results: List[RepoSearchResult] = []

        for item in items:
            score, explanation = self._calculate_score(item, prefs)
            
            result_item = RepoSearchResult(
                id=item["id"],
                name=item["name"],
                owner=item["owner"]["login"],
                full_name=item["full_name"],
                description=item.get("description"),
                html_url=item["html_url"],
                primary_language=item.get("language"),
                languages=[item["language"]] if item.get("language") else [],
                stars_count=item.get("stargazers_count", 0),
                forks_count=item.get("forks_count", 0),
                open_issues_count=item.get("open_issues_count", 0),
                updated_at=item.get("updated_at", ""),
                license=item.get("license", {}).get("spdx_id") if item.get("license") else None,
                default_branch=item.get("default_branch", "main"),
                topics=item.get("topics", []),
                has_contributing_guide=False,
                match_explanation=explanation
            )
            ranked_results.append(result_item)

        # Sort by match score descending
        ranked_results.sort(key=lambda x: x.match_explanation.score, reverse=True)

        response = DiscoveryResponse(
            total_found=len(ranked_results),
            repositories=ranked_results,
            query_summary=f"Discovered {len(ranked_results)} repositories matching {prefs.experience_level} experience and skills: {', '.join(prefs.languages or ['General Open Source'])}"
        )

        await cache_service.set_json(cache_key, response.model_dump(), ttl=600)
        return response

discovery_engine = DiscoveryEngine()
