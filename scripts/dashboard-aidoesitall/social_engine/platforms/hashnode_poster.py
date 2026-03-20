"""
Hashnode Poster — Publishes articles via the Hashnode GraphQL API.
Uses HASHNODE_API_KEY env var. No browser needed.
"""
import logging
import os

from social_engine.platforms.base_poster import BasePoster

log = logging.getLogger("social-engine")

HASHNODE_GQL_ENDPOINT = "https://gql.hashnode.com"


class HashnodePoster(BasePoster):
    name = "hashnode"
    method = "api"

    def _check_config(self):
        """Check for required Hashnode API key and publication ID."""
        self._api_key = os.getenv("HASHNODE_API_KEY")
        self._publication_id = os.getenv("HASHNODE_PUBLICATION_ID", "")

        if not self._api_key:
            log.warning("HashnodePoster disabled — missing HASHNODE_API_KEY env var")
            self.enabled = False

    def post(self, text, image_path=None, **kwargs):
        """
        Create a short post on Hashnode (uses post_article flow).
        Returns (success: bool, result_message: str).
        """
        title = kwargs.get("title", "")
        if not title:
            lines = text.strip().split("\n", 1)
            title = lines[0][:100]
            body = lines[1] if len(lines) > 1 else ""
        else:
            body = text
        return self.post_article(title, body, **kwargs)

    def post_article(self, title, body, tags=None, **kwargs):
        """
        Publish an article to Hashnode via GraphQL API.
        Returns (success: bool, result_message: str).
        """
        if not self.enabled:
            return False, "HashnodePoster is disabled — missing HASHNODE_API_KEY"

        import json
        import urllib.request
        import urllib.error

        tags = tags or ["dating", "technology", "startup"]

        # Build tag objects for Hashnode
        tag_objects = [{"name": t, "slug": t.lower().replace(" ", "-")} for t in tags[:5]]

        # GraphQL mutation for creating a post
        mutation = """
        mutation CreateStory($input: CreateStoryInput!) {
            createStory(input: $input) {
                post {
                    id
                    slug
                    title
                    url
                }
            }
        }
        """

        variables = {
            "input": {
                "title": title,
                "contentMarkdown": body,
                "tags": tag_objects,
                "isPartOfPublication": {
                    "publicationId": self._publication_id
                } if self._publication_id else None,
            }
        }

        # Clean None values
        if variables["input"]["isPartOfPublication"] is None:
            del variables["input"]["isPartOfPublication"]

        payload = json.dumps({
            "query": mutation,
            "variables": variables,
        }).encode("utf-8")

        headers = {
            "Content-Type": "application/json",
            "Authorization": self._api_key,
        }

        try:
            log.info(f"[{self.name}] Publishing article: {title[:50]}...")
            req = urllib.request.Request(
                HASHNODE_GQL_ENDPOINT,
                data=payload,
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                result = json.loads(resp.read().decode("utf-8"))

            if "errors" in result:
                error_msg = result["errors"][0].get("message", str(result["errors"]))
                log.error(f"[{self.name}] GraphQL error: {error_msg}")
                return False, error_msg

            post_data = result.get("data", {}).get("createStory", {}).get("post", {})
            post_url = post_data.get("url", "")
            post_id = post_data.get("id", "")

            log.info(f"[{self.name}] Article published: {post_url or post_id}")
            return True, post_url or post_id or "Posted successfully"

        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8", errors="replace")
            log.error(f"[{self.name}] HTTP {e.code}: {error_body[:200]}")
            return False, f"HTTP {e.code}: {error_body[:200]}"
        except Exception as e:
            log.error(f"[{self.name}] Post failed: {e}")
            return False, str(e)
