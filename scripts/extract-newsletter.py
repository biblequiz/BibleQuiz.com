#!/usr/bin/env python3

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from datetime import datetime
from email import policy
from email.message import EmailMessage
from email.parser import BytesParser
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from pathlib import Path
from typing import Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen


FORWARDED_HEADER = re.compile(
    r"^-{5,}\s*Forwarded message\s*-{5,}\s*$", re.IGNORECASE | re.MULTILINE
)
ORIGINAL_HEADERS = re.compile(
    r"From:\s*(?P<from>.+?)\r?\n"
    r"Date:\s*(?P<date>.+?)\r?\n"
    r"Subject:\s*(?P<subject>.+?)\r?\n"
    r"To:\s*(?P<to>.+?)(?:\r?\n){2}",
    re.IGNORECASE | re.DOTALL,
)
TRACKING_HOST_SUFFIX = ".rs6.net"
REGISTRATION_HOST = "registration.biblequiz.com"
SITE_ORIGIN = "https://biblequiz.com"


@dataclass(frozen=True)
class Link:
    text: str
    source_url: str
    url: str


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[tuple[str, str]] = []
        self._href: Optional[str] = None
        self._text: list[str] = []

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, Optional[str]]]
    ) -> None:
        if tag.lower() != "a":
            return

        self._href = dict(attrs).get("href")
        self._text = []

    def handle_data(self, data: str) -> None:
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() != "a" or self._href is None:
            return

        text = " ".join("".join(self._text).split())
        self.links.append((text, self._href))
        self._href = None
        self._text = []


def message_body(message: EmailMessage, subtype: str) -> str:
    body = message.get_body(preferencelist=(subtype,))
    return body.get_content() if body is not None else ""


def original_message_details(
    message: EmailMessage, plain_text: str
) -> tuple[str, Optional[datetime], str]:
    subject = str(message.get("Subject", "")).removeprefix("Fwd:").strip()
    date = parsedate_to_datetime(message["Date"]) if message.get("Date") else None
    body = plain_text

    forwarded = FORWARDED_HEADER.search(plain_text)
    if forwarded is None:
        return subject, date, body.strip()

    forwarded_text = plain_text[forwarded.end() :].lstrip()
    headers = ORIGINAL_HEADERS.search(forwarded_text)
    if headers is None:
        return subject, date, forwarded_text.strip()

    subject = headers.group("subject").strip()
    try:
        original_date = headers.group("date").strip().replace("\u202f", " ")
        date = parsedate_to_datetime(original_date.replace(" at ", " "))
    except (TypeError, ValueError):
        pass

    return subject, date, forwarded_text[headers.end() :].strip()


def extract_links(html: str) -> list[tuple[str, str]]:
    parser = LinkParser()
    parser.feed(html)

    links: list[tuple[str, str]] = []
    seen: set[tuple[str, str]] = set()
    for text, href in parser.links:
        item = (text, href)
        if item not in seen:
            seen.add(item)
            links.append(item)

    return links


def resolve_tracking_url(url: str, timeout: float) -> str:
    host = (urlparse(url).hostname or "").lower()
    if not host.endswith(TRACKING_HOST_SUFFIX):
        return url

    request = Request(url, headers={"User-Agent": "BibleQuiz.com newsletter importer"})
    try:
        with urlopen(request, timeout=timeout) as response:
            return response.geturl()
    except HTTPError as error:
        if error.geturl() != url:
            return error.geturl()
        raise RuntimeError(f"Could not resolve tracked URL: {url}") from error
    except URLError as error:
        raise RuntimeError(f"Could not resolve tracked URL: {url}") from error


def normalize_url(url: str, resolve_links: bool, timeout: float) -> str:
    normalized = resolve_tracking_url(url, timeout) if resolve_links else url
    parsed = urlparse(normalized)
    host = (parsed.hostname or "").lower()

    if host == REGISTRATION_HOST:
        match = re.fullmatch(
            r"/Registration/(?P<event_id>[0-9a-fA-F-]+)", parsed.fragment
        )
        if match:
            return f"{SITE_ORIGIN}/register/#/{match.group('event_id')}"

    if host in {"biblequiz.com", "www.biblequiz.com"}:
        return urljoin(f"{SITE_ORIGIN}/", parsed.path.lstrip("/")) + (
            f"?{parsed.query}" if parsed.query else ""
        ) + (f"#{parsed.fragment}" if parsed.fragment else "")

    if not parsed.scheme and not parsed.netloc:
        return urljoin(f"{SITE_ORIGIN}/", normalized)

    return normalized


def extract_newsletter(
    path: Path, resolve_links: bool = False, timeout: float = 15
) -> dict[str, object]:
    with path.open("rb") as source:
        message = BytesParser(policy=policy.default).parse(source)

    plain_text = message_body(message, "plain")
    html = message_body(message, "html")
    subject, date, content = original_message_details(message, plain_text)
    links = [
        Link(
            text=text,
            source_url=url,
            url=normalize_url(url, resolve_links=resolve_links, timeout=timeout),
        )
        for text, url in extract_links(html)
    ]

    return {
        "subject": subject,
        "date": date.isoformat() if date is not None else None,
        "content": content,
        "links": [asdict(link) for link in links],
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract editorial content and links from a newsletter .eml file."
    )
    parser.add_argument("eml", type=Path, help="Path to the source .eml file")
    parser.add_argument(
        "--resolve-links",
        action="store_true",
        help="Resolve supported email tracking redirects before normalizing URLs",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=15,
        help="Tracking-link resolution timeout in seconds (default: 15)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        result = extract_newsletter(
            args.eml, resolve_links=args.resolve_links, timeout=args.timeout
        )
    except (OSError, RuntimeError) as error:
        print(error, file=sys.stderr)
        return 1

    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
