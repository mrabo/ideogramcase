import { join } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_MODEL = "gemini-3.1-flash-image-preview";

async function loadGoogleGenAI() {
  try {
    return (await import("@google/genai")).GoogleGenAI;
  } catch (error) {
    const localInstallUrl = pathToFileURL(join(process.cwd(), "node_modules/@google/genai/dist/node/index.mjs")).href;
    return (await import(localInstallUrl)).GoogleGenAI;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mockConcepts(prompt) {
  const summary = prompt.trim().slice(0, 92) || "Campaign image concept";

  return [
    {
      id: `mock-${Date.now()}-1`,
      imageUrl: placeholderImage(1),
      promptSummary: summary,
    },
    {
      id: `mock-${Date.now()}-2`,
      imageUrl: placeholderImage(2),
      promptSummary: summary,
    },
  ];
}

function placeholderImage(variant) {
  const accent = variant === 1 ? "#f0a64f" : "#7ccf8a";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1125"><defs><radialGradient id="g" cx="50%" cy="38%" r="70%"><stop stop-color="#ffe9ba"/><stop offset=".58" stop-color="#f39ab3"/><stop offset="1" stop-color="#2f7d5b"/></radialGradient></defs><rect width="900" height="1125" rx="62" fill="url(#g)"/><circle cx="${variant === 1 ? 330 : 570}" cy="390" r="170" fill="${accent}" opacity=".62"/><path d="M180 790c115-170 240-195 375-74 72 65 131 80 192 42" fill="none" stroke="#fff6da" stroke-width="38" stroke-linecap="round" opacity=".78"/><path d="M230 905c145-66 292-67 440-4" fill="none" stroke="#1e513f" stroke-width="26" stroke-linecap="round" opacity=".38"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function dataUrlToPart(dataUrl) {
  const match = /^data:(.+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    return null;
  }

  return {
    inlineData: {
      mimeType: match[1],
      data: match[2],
    },
  };
}

function buildPrompt(campaignPrompt) {
  return [
    "Create one polished, professional campaign image.",
    "Use the inspiration images for mood, palette, materials, lighting, and styling.",
    "Do not explain the result. Return only the image output.",
    `Campaign image request: ${campaignPrompt}`,
  ].join("\n");
}

async function generateConceptImage(ai, model, imageParts, campaignPrompt, conceptNumber) {
  const result = await ai.models.generateContent({
    model,
    contents: [{ text: buildPrompt(campaignPrompt) }, ...imageParts],
  });
  const part = result.candidates?.[0]?.content?.parts?.find((candidatePart) => candidatePart.inlineData?.data);

  if (!part?.inlineData?.data) {
    return null;
  }

  return {
    id: `gemini-${Date.now()}-${conceptNumber}`,
    imageUrl: `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`,
    promptSummary: campaignPrompt.slice(0, 92),
  };
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Use POST to generate visuals." });
  }

  const body = request.body ?? {};
  const campaignPrompt = String(body.campaignPrompt ?? "").trim();

  if (!campaignPrompt) {
    return response.status(400).json({ error: "Describe the campaign image first." });
  }

  if (!process.env.GEMINI_API_KEY) {
    await sleep(900);
    return response.status(200).json({ concepts: mockConcepts(campaignPrompt) });
  }

  try {
    const GoogleGenAI = await loadGoogleGenAI();
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = process.env.GEMINI_IMAGE_MODEL || DEFAULT_MODEL;
    const imageParts = (Array.isArray(body.inspirationImages) ? body.inspirationImages.slice(0, 5) : [])
      .filter(Boolean)
      .map(dataUrlToPart)
      .filter(Boolean);

    const concepts = (
      await Promise.all([1, 2].map((conceptNumber) => generateConceptImage(ai, model, imageParts, campaignPrompt, conceptNumber)))
    ).filter(Boolean);

    if (concepts.length < 2) {
      return response.status(502).json({ error: "No image concepts came back. Try regenerating." });
    }

    return response.status(200).json({ concepts });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "The visuals could not be generated. Try again." });
  }
}
