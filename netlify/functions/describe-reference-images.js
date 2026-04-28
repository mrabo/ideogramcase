import { join } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_MODEL = "gemini-2.5-flash";
const REFERENCE_DESCRIPTION_PROMPT = [
  "Look at the uploaded images and write a paragraph describing the visual characteristics of them.",
  "Write it in a way that could describe a wide variety of images.",
  "For example, do not specify things like composition because differently composed images can still have the same style.",
  "Write in bullet points.",
].join(" ");

async function loadGoogleGenAI() {
  try {
    return (await import("@google/genai")).GoogleGenAI;
  } catch (error) {
    const localInstallUrl = pathToFileURL(join(process.cwd(), "node_modules/@google/genai/dist/node/index.mjs")).href;
    return (await import(localInstallUrl)).GoogleGenAI;
  }
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
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

function mockDescription() {
  return [
    "- Bright, friendly color relationships with soft contrast and a polished commercial feel.",
    "- Clean shapes, approachable textures, and warm visual details that can translate across many campaign image types.",
    "- A cohesive style direction that favors inviting, brand-ready imagery over technical or overly literal visuals.",
  ].join("\n");
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Use POST to describe reference images." });
  }

  const body = JSON.parse(event.body || "{}");
  const imageParts = (Array.isArray(body.inspirationImages) ? body.inspirationImages.slice(0, 5) : [])
    .filter(Boolean)
    .map(dataUrlToPart)
    .filter(Boolean);

  if (imageParts.length === 0) {
    return json(400, { error: "Upload reference images first." });
  }

  if (!process.env.GEMINI_API_KEY) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return json(200, { description: mockDescription() });
  }

  try {
    const GoogleGenAI = await loadGoogleGenAI();
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = process.env.GEMINI_TEXT_MODEL || DEFAULT_MODEL;
    const result = await ai.models.generateContent({
      model,
      contents: [{ text: REFERENCE_DESCRIPTION_PROMPT }, ...imageParts],
    });
    const description = result.text?.trim();

    if (!description) {
      return json(502, { error: "No reference description came back. Try uploading again." });
    }

    return json(200, { description });
  } catch (error) {
    console.error(error);
    return json(500, { error: "The reference images could not be described. Try again." });
  }
}
