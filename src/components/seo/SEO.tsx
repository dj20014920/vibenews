import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  image?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
}

// Lightweight SEO component to manage head tags without external deps
export function SEO({
  title = "VibeNews – 바이브 코딩 트렌드 뉴스 & 커뮤니티",
  description = "AI 코딩 도구 뉴스와 커뮤니티. Cursor, Lovable, GitHub Copilot 등 최신 트렌드를 한 곳에서.",
  canonicalUrl,
  image = "https://lovable.dev/opengraph-image-p98pqg.png",
  jsonLd,
}: SEOProps) {
  useEffect(() => {
    const doc = document;

    // Helper to upsert meta tags
    const upsertMeta = (attr: "name" | "property", key: string, content: string) => {
      let el = doc.querySelector<HTMLMetaElement>(`meta[${attr}='${key}']`);
      if (!el) {
        el = doc.createElement("meta");
        el.setAttribute(attr, key);
        doc.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const safeTitle = title.length > 60 ? `${title.slice(0, 57)}...` : title;
    const safeDesc = description.length > 160 ? `${description.slice(0, 157)}...` : description;
    const url = canonicalUrl || window.location.href;

    // Title
    doc.title = safeTitle;

    // Basic meta
    upsertMeta("name", "description", safeDesc);
    upsertMeta("name", "author", "VibeNews");

    // Canonical
    let linkCanonical = doc.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (!linkCanonical) {
      linkCanonical = doc.createElement("link");
      linkCanonical.setAttribute("rel", "canonical");
      doc.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute("href", url);

    // Open Graph
    upsertMeta("property", "og:title", safeTitle);
    upsertMeta("property", "og:description", safeDesc);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", image);

    // Twitter
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", safeTitle);
    upsertMeta("name", "twitter:description", safeDesc);
    upsertMeta("name", "twitter:image", image);

    // JSON-LD structured data
    // Remove previous injected JSON-LD from this component
    document.querySelectorAll("script[data-seo-jsonld='true']").forEach((n) => n.remove());
    const jsons = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
    jsons.forEach((obj) => {
      const script = doc.createElement("script");
      script.setAttribute("type", "application/ld+json");
      script.setAttribute("data-seo-jsonld", "true");
      script.text = JSON.stringify(obj);
      doc.head.appendChild(script);
    });
  }, [title, description, canonicalUrl, image, jsonLd]);

  // This component only manages head; it renders nothing
  return null;
}

export function defaultSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "VibeNews",
    url: typeof window !== "undefined" ? window.location.origin : "",
    potentialAction: {
      "@type": "SearchAction",
      target: `${typeof window !== "undefined" ? window.location.origin : ""}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
