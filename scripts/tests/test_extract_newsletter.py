import importlib.util
import tempfile
import unittest
from pathlib import Path


SCRIPT_PATH = Path(__file__).parents[1] / "extract-newsletter.py"
SPEC = importlib.util.spec_from_file_location("extract_newsletter", SCRIPT_PATH)
assert SPEC is not None and SPEC.loader is not None
extract_newsletter = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(extract_newsletter)


class ExtractNewsletterTests(unittest.TestCase):
    def test_extracts_forwarded_content_and_normalizes_links(self) -> None:
        source = b"""From: Editor <editor@example.com>
To: Publisher <publisher@example.com>
Subject: Fwd: BQ Newsletter - June 2026
Date: Sun, 5 Jul 2026 21:35:30 -0500
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary=test

--test
Content-Type: text/plain; charset=utf-8

---------- Forwarded message ---------
From: AG Youth Ministries <bq@ag.org>
Date: Tue, Jun 9, 2026 at 11:29 AM
Subject: BQ Newsletter - June 2026
To: editor@example.com

JUNE 2026

Newsletter content.
--test
Content-Type: text/html; charset=utf-8

<p><a href="http://www.biblequiz.com/tbq/">Teen Bible Quiz</a></p>
<p><a href="https://registration.biblequiz.com/#/Registration/123e4567-e89b-12d3-a456-426614174000">Register</a></p>
--test--
"""
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "newsletter.eml"
            path.write_bytes(source)

            result = extract_newsletter.extract_newsletter(path)

        self.assertEqual(result["subject"], "BQ Newsletter - June 2026")
        self.assertEqual(result["date"], "2026-06-09T11:29:00")
        self.assertEqual(result["content"], "JUNE 2026\n\nNewsletter content.")
        self.assertEqual(
            result["links"],
            [
                {
                    "text": "Teen Bible Quiz",
                    "source_url": "http://www.biblequiz.com/tbq/",
                    "url": "https://biblequiz.com/tbq/",
                },
                {
                    "text": "Register",
                    "source_url": "https://registration.biblequiz.com/#/Registration/123e4567-e89b-12d3-a456-426614174000",
                    "url": "https://biblequiz.com/register/#/123e4567-e89b-12d3-a456-426614174000",
                },
            ],
        )


if __name__ == "__main__":
    unittest.main()
