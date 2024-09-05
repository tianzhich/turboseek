import { NextResponse } from "next/server";
import { z } from "zod";

let excludedSites = ["youtube.com"];

let searchEngine: "bing" | "serper" | "exa" = "exa";

export async function POST(request: Request) {
  let { question } = await request.json();
  let results: any[] = [];
  let extra = {};

  if (searchEngine === "bing") {
    const BING_API_KEY = process.env["BING_API_KEY"];
    if (!BING_API_KEY) {
      throw new Error("BING_API_KEY is required");
    }

    const params = new URLSearchParams({
      q: `${question} ${excludedSites.map((site) => `-site:${site}`).join(" ")}`,
      mkt: "en-US",
      count: "6",
      safeSearch: "Strict",
    });

    const response = await fetch(
      `https://api.bing.microsoft.com/v7.0/search?${params}`,
      {
        method: "GET",
        headers: {
          "Ocp-Apim-Subscription-Key": BING_API_KEY,
        },
      },
    );

    const BingJSONSchema = z.object({
      webPages: z.object({
        value: z.array(z.object({ name: z.string(), url: z.string() })),
      }),
    });

    const rawJSON = await response.json();
    const data = BingJSONSchema.parse(rawJSON);

    results = data.webPages.value.map((result) => ({
      name: result.name,
      url: result.url,
    }));
  } else if (searchEngine === "serper") {
    const SERPER_API_KEY = process.env["SERPER_API_KEY"];
    if (!SERPER_API_KEY) {
      throw new Error("SERPER_API_KEY is required");
    }

    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: question,
        num: 6,
      }),
    });

    const rawJSON = await response.json();

    const SerperJSONSchema = z.object({
      organic: z.array(z.object({ title: z.string(), link: z.string() })),
    });

    const data = SerperJSONSchema.parse(rawJSON);

    results = data.organic.map((result) => ({
      name: result.title,
      url: result.link,
    }));
  } else if (searchEngine === "exa") {
    const EXA_API_KEY = process.env["EXA_API_KEY"];
    if (!EXA_API_KEY) {
      throw new Error("EXA_API_KEY is required");
    }

    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-api-key": EXA_API_KEY,
      },
      body: JSON.stringify({
        query: question,
        type: "auto",
        numResults: 6,
      }),
    });

    const rawJSON = await response.json();

    const ExaJSONSchema = z.object({
      autopromptString: z.optional(z.string()),
      results: z.array(z.object({ title: z.string(), url: z.string() })),
    });

    const data = ExaJSONSchema.parse(rawJSON);

    results = data.results.map((result) => ({
      name: result.title,
      url: result.url,
    }));
    extra = { autopromptString: data.autopromptString };
  }

  return NextResponse.json({ sources: results, ...extra });
}
