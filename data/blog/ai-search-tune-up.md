---
title: The 20-Minute AI Search Tune-Up — llms.txt, Schema and the Basics Most Melbourne Websites Miss
description: Only ~10% of websites have llms.txt and most Melbourne sites still block or ignore AI crawlers. Here's the practical 20-minute checklist to make your site readable — and quotable — by ChatGPT, Perplexity and Google AI.
date: 2026-07-07
tags: AI Search, Technical
hero: ai-tuneup.jpg
heroAlt: HTML code on a laptop screen — the technical layer AI crawlers read before they ever quote your site
heroCredit: Photo by Negative Space on Pexels
heroCreditUrl: https://www.pexels.com/photo/gray-laptop-computer-showing-html-codes-in-shallow-focus-photography-160107/
faq: [{"q":"What is llms.txt?","a":"llms.txt is a plain-text file at your site root (yoursite.com/llms.txt) that gives AI systems a curated index of your site — what you do, your key pages, and short descriptions of each. Think of it as a sitemap written for language models. Adoption is only around 10% of domains in 2026, so having one is still a genuine differentiator."},{"q":"Should I block AI crawlers like GPTBot?","a":"If you want AI assistants to recommend your business — no. Blocking GPTBot, ClaudeBot or PerplexityBot in robots.txt removes you from the sources those assistants can read and cite. Some publishers block them to protect content; for a local business trying to be found, blocking is self-sabotage. Check your robots.txt today — some security plugins and hosts block them by default."},{"q":"Does schema markup actually change AI answers?","a":"Yes — structured data is one of the six signals consistently associated with AI citations (entities, authority, structure, freshness, depth, machine accessibility). Schema tells models exactly what your business is, where it operates and what it offers, which reduces the wrong-details problem and raises citation confidence. LocalBusiness, Organization, Service and FAQPage are the four that matter for most Melbourne businesses."},{"q":"How do I know if AI search is sending me traffic?","a":"Check your analytics referrers for chatgpt.com, perplexity.ai, gemini.google.com and copilot.microsoft.com, and watch for branded searches rising after AI answers mention you. In GA4, build a simple exploration filtering session source by those domains. Numbers are small for most businesses today — but they convert well, because the assistant already pre-sold the click."}]
sources: [{"t":"LLM SEO in 2026 — llms.txt adoption and citation signals (LLMrefs)","u":"https://llmrefs.com/llm-seo"},{"t":"Search Engine Land — SEO in 2026: higher standards, AI influence","u":"https://searchengineland.com/seo-2026-higher-standards-ai-influence-web-catching-up-473540"},{"t":"Do AI assistants recommend your Melbourne business? (our companion guide)","u":"https://melbournewebdesigners.com/blog/ai-search-visibility-melbourne/"}]
---
Most Melbourne websites are invisible to AI assistants for boring, fixable reasons. Not because the business isn't good — because the site never tells the machines what it is.

The strategic version of this problem (reviews, mentions, authority) is covered in our [AI visibility guide](https://melbournewebdesigners.com/blog/ai-search-visibility-melbourne/). This piece is the technical warm-up: four fixes, about 20 minutes with your developer — or one email to whoever built your site.

## Minute 0–5: check you're not blocking the crawlers

AI assistants can only recommend what their crawlers can read. Open `yoursite.com/robots.txt` and look for these user agents: **GPTBot** (OpenAI), **ClaudeBot** (Anthropic), **PerplexityBot**, **Google-Extended** and **Bingbot**. If any are Disallowed — and some security plugins and hosts do this silently — you've opted out of being recommended.

While you're there, confirm your sitemap line exists (`Sitemap: https://yoursite.com/sitemap.xml`). It's still the fastest way for every crawler, AI or classic, to learn your site's shape.

## Minute 5–10: add llms.txt

`llms.txt` is a curated, plain-language index of your site that lives at `yoursite.com/llms.txt` — a menu written for machines. Ours describes what this directory is, lists every key page with a one-line summary, and states the disclosure policy. Adoption sits around **10% of domains**, which means for most Melbourne categories you'd be the only business in your niche with one.

A minimal, effective llms.txt:

- One H1 line: your business name.
- A blockquote paragraph: what you do, for whom, where (suburb/city), since when.
- A "Key pages" list: each important page as a link with a one-sentence description written in plain English — services, pricing, contact, FAQs.

That's it. Ten lines of honest text beats a thousand lines of markup nobody wrote for the reader.

## Minute 10–15: schema markup — the four types that matter

Structured data is how you stop AI assistants guessing. Four schema types cover most Melbourne businesses:

1. **LocalBusiness** (or your specific subtype) — name, address, phone, hours, service area. This is the antidote to the wrong-details problem that plagues AI answers.
2. **Organization** — your entity: legal name, logo, socials, founding date. It anchors who "you" are across the web.
3. **Service** or **Product** — what you actually sell, in machine-readable form.
4. **FAQPage** — your real customer questions with direct answers. FAQ schema is disproportionately quoted by assistants because it's literally formatted as question → answer.

Your developer adds these as JSON-LD in the page head; test with Google's Rich Results tool. If your site was built in the last few years and has none of this, that's a conversation worth having with your agency — or a reason to [find a better one](https://melbournewebdesigners.com/).

## Minute 15–20: make one page directly quotable

Pick your most valuable page — usually pricing or your main service — and restructure the opening to be quotable:

- **First two sentences answer the question outright**, with a number and a date: "In 2026, [service] in Melbourne typically costs A$X–Y. Most projects take N weeks."
- **Use question-format H2s** ("How much does X cost in Melbourne?") — they map one-to-one onto what people ask assistants.
- **Show a visible updated date.** Recency is a citation signal — Perplexity gives pages under 30 days old roughly 3× the citations.
- **Cite a source or two.** Content that references data earns more references itself.

This is the direct-answer format: the difference between a page an assistant can lift a sentence from, and a page it skims past.

## The honest limits

The tune-up makes you *readable*. It doesn't make you *recommended* — that still comes from reviews, consistent business data and third-party mentions, which take weeks of graft rather than minutes of markup. Do this first because it's cheap, it compounds everything else, and almost none of your competitors have bothered yet.

If you'd rather we check all of it for you — crawler access, llms.txt, schema, quotability, plus how you currently show up in ChatGPT, Perplexity and Google AI — request the free **AI Search Visibility Audit** via the popup on this site (valued at $497, no sales call). And if the audit reveals your site needs more than a tune-up, [get matched free](https://melbournewebdesigners.com/get-quote/) with a Melbourne studio that builds this in from day one.
