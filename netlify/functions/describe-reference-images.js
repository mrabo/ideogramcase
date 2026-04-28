import { join } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_MODEL = "gemini-2.5-flash";
const REFERENCE_DESCRIPTION_PROMPT = [
  "Look at the uploaded images and write a paragraph describing the visual characteristics of them.",
  "Write it in a way that could describe a wide variety of images.",
  "For example, do not specify things like composition because differently composed images can still have the same style.",
  "Return only plain-text bullet lines.",
  "Each line must be a simple bullet, such as a dash or an asterisk followed by a space.",
  "Do not include headings, introductions, bold text, italics, numbered lists, or any other formatting.",
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

function normalizeBulletText(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^here (are|is)\b/i.test(line))
    .filter((line) => !/^visual characteristics\b/i.test(line))
    .map((line) => {
      const bulletMatch = /^\s*([-*•])\s+(.+)$/.exec(line);
      const marker = bulletMatch?.[1] === "*" ? "*" : "-";
      const text = (bulletMatch?.[2] ?? line.replace(/^\s*\d+[.)]\s*/, ""))
        .replace(/\*\*/g, "")
        .replace(/__/g, "")
        .replace(/[*_`]/g, "")
        .trim();

      return text ? `${marker} ${text}` : "";
    })
    .filter(Boolean)
    .join("\n");
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
    const description = normalizeBulletText(result.text ?? "");

    if (!description) {
      return json(502, { error: "No reference description came back. Try uploading again." });
    }

    return json(200, { description });
  } catch (error) {
    console.error(error);
    return json(500, { error: "The reference images could not be described. Try again." });
  }
}
