"""Live regression checks using the injected admin session; never prints credentials."""
import json
import os
import unittest
from pathlib import Path

import requests


class ReleaseStorageSecurityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if os.environ.get("LOVABLE_BROWSER_AUTH_STATUS") != "injected":
            raise unittest.SkipTest("An injected admin session is required")
        session = json.loads(os.environ["LOVABLE_BROWSER_SUPABASE_SESSION_JSON"])
        # The access token contains the issuer, but is never logged or written.
        import base64
        payload = session["access_token"].split(".")[1]
        claims = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
        cls.origin = claims["iss"].removesuffix("/auth/v1")
        config = dict(line.split("=", 1) for line in Path(".env").read_text().splitlines() if line.startswith("VITE_SUPABASE_PUBLISHABLE_KEY="))
        api_key = config["VITE_SUPABASE_PUBLISHABLE_KEY"].strip('"\'')
        cls.headers = {"Authorization": "Bearer " + session["access_token"], "apikey": api_key}
        cls.public_headers = {"apikey": api_key}
        cls.http = requests.Session()

    def test_admin_can_list_release_files(self):
        response = self.http.post(self.origin + "/storage/v1/object/list/app-releases", headers=self.headers, json={"prefix": "", "limit": 100}, timeout=30)
        self.assertEqual(response.status_code, 200)
        names = [item["name"] for item in response.json()]
        self.assertIn("latest.json", names)

    def test_unauthenticated_cannot_list_release_files(self):
        response = self.http.post(self.origin + "/storage/v1/object/list/app-releases", headers=self.public_headers, json={"prefix": "", "limit": 100}, timeout=30)
        if response.status_code == 200:
            self.assertEqual(response.json(), [])
        else:
            self.assertIn(response.status_code, (400, 401, 403))

    def test_published_signed_download_still_works(self):
        response = self.http.get(self.origin + "/rest/v1/app_releases", headers=self.headers, params={"select": "apk_public_url", "is_published": "eq.true", "limit": "1"}, timeout=30)
        self.assertEqual(response.status_code, 200)
        releases = response.json()
        self.assertEqual(len(releases), 1)
        download = self.http.get(releases[0]["apk_public_url"], headers={"Range": "bytes=0-3"}, stream=True, timeout=30)
        self.assertIn(download.status_code, (200, 206))
        self.assertEqual(next(download.iter_content(chunk_size=4)), b"PK\x03\x04")
        download.close()


if __name__ == "__main__":
    unittest.main()