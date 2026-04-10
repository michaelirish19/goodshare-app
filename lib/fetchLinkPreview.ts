import * as cheerio from "cheerio";

export type LinkPreview = {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
};

function cleanText(value?: string | null) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function toAbsoluteUrl(value: string, baseUrl: string) {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return "";
  }
}

function pickFirst(...values: Array<string | undefined | null>) {
  for (const value of values) {
    const cleaned = cleanText(value);
    if (cleaned) return cleaned;
  }
  return "";
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        referer: "https://www.google.com/",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (!response.ok) {
      console.log("Preview fetch failed with status:", response.status, url);
      return null;
    }

    const html = await response.text();

    if (!html) {
      console.log("Preview fetch returned empty HTML:", url);
      return null;
    }

    const $ = cheerio.load(html);

    const title = pickFirst(
      $('meta[property="og:title"]').attr("content"),
      $('meta[name="twitter:title"]').attr("content"),
      $('meta[name="title"]').attr("content"),
      $("title").text(),
      $("h1").first().text()
    );

    const description = pickFirst(
      $('meta[property="og:description"]').attr("content"),
      $('meta[name="twitter:description"]').attr("content"),
      $('meta[name="description"]').attr("content")
    );

    const imageRaw = pickFirst(
      $('meta[property="og:image"]').attr("content"),
      $('meta[name="twitter:image"]').attr("content"),
      $("img").first().attr("src")
    );

    const siteName = pickFirst(
      $('meta[property="og:site_name"]').attr("content"),
      new URL(url).hostname.replace(/^www\./, "")
    );

    const image = imageRaw ? toAbsoluteUrl(imageRaw, url) : "";

    const preview = {
      url,
      title,
      description,
      image,
      siteName,
    };

    if (!preview.title && !preview.description && !preview.image) {
      console.log("Preview parse found no usable metadata:", url);
      return null;
    }

    return preview;
  } catch (error) {
    console.log("Preview fetch crashed for URL:", url, error);
    return null;
  }
}