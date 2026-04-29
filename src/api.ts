export type Concept = {
  id: string;
  imageUrl: string;
  promptSummary: string;
};

export type GeneratePayload = {
  logo: string | null;
  inspirationImages: string[];
  campaignPrompt: string;
};

export type DescribeReferenceImagesPayload = {
  inspirationImages: string[];
};

export async function generateConcepts(payload: GeneratePayload): Promise<Concept[]> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const details = data?.details ? ` ${data.details}` : "";
    throw new Error(`${data?.error ?? "The visuals could not be generated."}${details}`);
  }

  return data.concepts;
}

export async function describeReferenceImages(payload: DescribeReferenceImagesPayload): Promise<string> {
  const response = await fetch("/api/describe-reference-images", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error ?? "The reference images could not be described.");
  }

  return data.description;
}
