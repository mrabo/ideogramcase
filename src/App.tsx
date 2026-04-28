import { ChangeEvent, DragEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Concept, describeReferenceImages, generateConcepts } from "./api";

type UploadImage = {
  id: string;
  name: string;
  dataUrl: string;
};

const MAX_INSPIRATION_IMAGES = 5;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

function isImage(file: File) {
  return file.type.startsWith("image/");
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="upload-icon">
      <path d="M11 4h2v9.2l2.8-2.8 1.4 1.4L12 17l-5.2-5.2 1.4-1.4 2.8 2.8V4Z" />
      <path d="M5 15h2v4h10v-4h2v6H5v-6Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="reference-description-check">
      <path d="m9.2 16.2-3.4-3.4-1.4 1.4 4.8 4.8 10.4-10.4-1.4-1.4-9 9Z" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="small-icon">
      <path d="M5 5h14v14H5V5Zm2 2v7.1l2.5-2.6 3 3 1.5-1.8 3 3.5V7H7Zm2.8 4.1a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6Z" />
      <path d="M18 3h2v2h2v2h-2v2h-2V7h-2V5h2V3Z" />
    </svg>
  );
}

function App() {
  const [logo, setLogo] = useState<UploadImage | null>(null);
  const [inspirationImages, setInspirationImages] = useState<UploadImage[]>([]);
  const [referenceImageDescription, setReferenceImageDescription] = useState("");
  const [referenceDescriptionStatus, setReferenceDescriptionStatus] = useState<"idle" | "describing" | "error">("idle");
  const [campaignPrompt, setCampaignPrompt] = useState("");
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [status, setStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const inspirationInputRef = useRef<HTMLInputElement>(null);
  const referenceDescriptionRef = useRef<HTMLTextAreaElement>(null);

  const inspirationSlots = useMemo(
    () => Array.from({ length: MAX_INSPIRATION_IMAGES }, (_, index) => inspirationImages[index] ?? null),
    [inspirationImages],
  );
  const geminiReferenceDescriptionHook = {
    value: referenceImageDescription,
    setDescription: setReferenceImageDescription,
  };

  function resizeReferenceDescription() {
    const textarea = referenceDescriptionRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  useLayoutEffect(() => {
    resizeReferenceDescription();
  }, [referenceImageDescription, referenceDescriptionStatus]);

  useEffect(() => {
    let isCurrent = true;

    if (inspirationImages.length === 0) {
      setReferenceImageDescription("");
      setReferenceDescriptionStatus("idle");
      return;
    }

    setReferenceDescriptionStatus("describing");
    setReferenceImageDescription("");

    void describeReferenceImages({
      inspirationImages: inspirationImages.map((image) => image.dataUrl),
    })
      .then((description) => {
        if (!isCurrent) {
          return;
        }

        setReferenceImageDescription(description);
        setReferenceDescriptionStatus("idle");
      })
      .catch(() => {
        if (!isCurrent) {
          return;
        }

        setReferenceImageDescription("");
        setReferenceDescriptionStatus("error");
      });

    return () => {
      isCurrent = false;
    };
  }, [inspirationImages]);

  async function setLogoFile(file: File) {
    if (!isImage(file)) {
      setMessage("Please choose an image file for your logo.");
      setStatus("error");
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    setLogo({ id: crypto.randomUUID(), name: file.name, dataUrl });
    setMessage("");
    setStatus("idle");
  }

  async function addInspirationFiles(fileList: FileList | File[]) {
    const remainingSlots = MAX_INSPIRATION_IMAGES - inspirationImages.length;
    const files = Array.from(fileList).filter(isImage).slice(0, remainingSlots);

    if (files.length === 0) {
      setMessage(
        inspirationImages.length >= MAX_INSPIRATION_IMAGES
          ? "You already have five inspiration images."
          : "Please choose image files for inspiration.",
      );
      setStatus("error");
      return;
    }

    const images = await Promise.all(
      files.map(async (file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        dataUrl: await fileToDataUrl(file),
      })),
    );

    setInspirationImages((current) => [...current, ...images].slice(0, MAX_INSPIRATION_IMAGES));
    setMessage("");
    setStatus("idle");
  }

  function handleLogoInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      void setLogoFile(file);
    }
    event.target.value = "";
  }

  function handleInspirationInput(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      void addInspirationFiles(event.target.files);
    }
    event.target.value = "";
  }

  function handleLogoDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      void setLogoFile(file);
    }
  }

  function handleInspirationDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (event.dataTransfer.files.length) {
      void addInspirationFiles(event.dataTransfer.files);
    }
  }

  function removeInspiration(id: string) {
    setInspirationImages((current) => current.filter((image) => image.id !== id));
  }

  async function handleGenerate() {
    if (!campaignPrompt.trim()) {
      setStatus("error");
      setMessage("Describe the campaign image first.");
      return;
    }

    setStatus("generating");
    setMessage("Growing two fresh concepts...");

    try {
      const nextConcepts = await generateConcepts({
        logo: logo?.dataUrl ?? null,
        inspirationImages: inspirationImages.map((image) => image.dataUrl),
        campaignPrompt,
      });
      setConcepts(nextConcepts);
      setStatus("success");
      setMessage("Two concepts are ready.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "The visuals could not be generated.");
    }
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <h1>BrandBloom</h1>
        <p>Create unique brand-aligned imagery.</p>
      </header>

      <section className="workspace" aria-label="Campaign image generator">
        <div className="upload-grid">
          <div className="panel logo-panel">
            <div className="section-heading">
              <span>Upload logo</span>
              <p>Upload your brand mark to anchor the aesthetic of your campaign.</p>
            </div>

            <button
              className={`drop-zone logo-drop ${logo ? "has-image" : ""}`}
              type="button"
              onClick={() => logoInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleLogoDrop}
              aria-label="Upload logo"
            >
              {logo ? (
                <>
                  <img src={logo.dataUrl} alt={logo.name} />
                  <span className="file-name">{logo.name}</span>
                </>
              ) : (
                <>
                  <UploadIcon />
                  <strong>Drag & drop your logo</strong>
                  <small>PNG or SVG preferred</small>
                </>
              )}
            </button>
            <input ref={logoInputRef} className="hidden-input" type="file" accept="image/*,.svg" onChange={handleLogoInput} />
          </div>

          <div className="panel inspiration-panel">
            <div className="section-heading">
              <span>Add brand style references</span>
              <p>Select up to five images that capture the desired mood or color palette.</p>
            </div>

            <div className="reference-upload-stack">
              <button
                className="drop-zone reference-drop"
                type="button"
                onClick={() => inspirationInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleInspirationDrop}
                aria-label="Upload reference images"
              >
                <UploadIcon />
                <strong>Drag & drop reference images (up to 5)</strong>
              </button>

              <div className="inspiration-grid">
                {inspirationSlots.map((image, index) =>
                  image ? (
                    <div className="inspiration-tile filled" key={image.id}>
                      <img src={image.dataUrl} alt={image.name} />
                      <button type="button" onClick={() => removeInspiration(image.id)} aria-label={`Remove ${image.name}`}>
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      className="inspiration-tile empty"
                      key={`slot-${index}`}
                      type="button"
                      onClick={() => inspirationInputRef.current?.click()}
                      aria-label={`Add inspiration image ${index + 1}`}
                    >
                      <PhotoIcon />
                    </button>
                  ),
                )}
              </div>
            </div>
            <input
              ref={inspirationInputRef}
              className="hidden-input"
              type="file"
              accept="image/*"
              multiple
              onChange={handleInspirationInput}
            />
          </div>
        </div>

        <details
          className="prompt-section reference-description-section"
          onToggle={() => {
            requestAnimationFrame(resizeReferenceDescription);
          }}
        >
          <summary>
            Model data: Reference image description
            {referenceDescriptionStatus === "describing" ? <span className="reference-description-spinner" aria-label="Loading" /> : null}
            {referenceDescriptionStatus === "idle" && referenceImageDescription ? (
              <span aria-label="Complete">
                <CheckIcon />
              </span>
            ) : null}
          </summary>
          <textarea
            ref={referenceDescriptionRef}
            id="reference-description"
            value={geminiReferenceDescriptionHook.value}
            readOnly
            data-gemini-hook="reference-image-description"
            placeholder={
              referenceDescriptionStatus === "describing"
                ? "Gemini is describing the uploaded reference images..."
                : referenceDescriptionStatus === "error"
                  ? "Gemini could not describe these reference images. Try uploading them again."
                  : inspirationImages.length
                ? "Gemini will describe the uploaded reference images here."
                : "Upload reference images to prepare a Gemini description."
            }
            aria-label="Gemini reference image description"
          />
        </details>

        <div className="prompt-section">
          <label htmlFor="campaign-prompt">Describe image to generate</label>
          <textarea
            id="campaign-prompt"
            value={campaignPrompt}
            onChange={(event) => setCampaignPrompt(event.target.value)}
          />
        </div>

        <div className="action-row">
          <button className="generate-button" type="button" disabled={status === "generating"} onClick={handleGenerate}>
            {status === "generating" ? "Generating..." : concepts.length ? "Regenerate" : "Generate"}
          </button>
          {message ? <p className={`status-message ${status}`}>{message}</p> : null}
        </div>

        <section className="concepts-section" aria-label="Your images">
          <div className="divider-title">
            <span />
            <h2>Your images</h2>
            <span />
          </div>

          <div className="concept-grid">
            {(concepts.length ? concepts : defaultConcepts).map((concept, index) => (
              <article className={`concept-card ${concepts.length ? "" : "placeholder"}`} key={concept.id}>
                <img src={concept.imageUrl} alt={`Concept ${index + 1}`} />
                <div className="concept-caption">
                  <strong>Concept {index + 1}</strong>
                  <span>{concept.promptSummary}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

const defaultConcepts: Concept[] = [
  {
    id: "default-1",
    imageUrl:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 1125'%3E%3Cdefs%3E%3CradialGradient id='g' cx='45%25' cy='37%25' r='70%25'%3E%3Cstop stop-color='%232b5b67'/%3E%3Cstop offset='.55' stop-color='%230d1d24'/%3E%3Cstop offset='1' stop-color='%23050a10'/%3E%3C/radialGradient%3E%3ClinearGradient id='p' x1='0' x2='1'%3E%3Cstop stop-color='%23e9a6b6'/%3E%3Cstop offset='1' stop-color='%23f7c762'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='900' height='1125' rx='62' fill='url(%23g)'/%3E%3Cg fill='none' stroke='%237fd9ec' opacity='.5' stroke-width='3'%3E%3Cpath d='M255 355c78-57 151-52 221 15s135 76 194 27' stroke-dasharray='11 17'/%3E%3Ccircle cx='255' cy='355' r='15'/%3E%3Ccircle cx='475' cy='370' r='17'/%3E%3Ccircle cx='670' cy='397' r='15'/%3E%3C/g%3E%3Crect x='255' y='575' width='390' height='210' rx='28' fill='%23102027' stroke='%238cc8d2' stroke-width='4'/%3E%3Crect x='312' y='520' width='265' height='160' rx='16' fill='%23234657' stroke='%2397dcea' stroke-width='5'/%3E%3Crect x='340' y='548' width='210' height='100' rx='10' fill='%230e2635'/%3E%3Cpath d='M302 786h296l50 86H244z' fill='%23080c11'/%3E%3Cellipse cx='450' cy='904' rx='260' ry='28' fill='%23010205' opacity='.7'/%3E%3Cpath d='M330 880c80 24 175 23 263-1' stroke='url(%23p)' stroke-width='7' stroke-linecap='round' opacity='.55'/%3E%3Ctext x='450' y='995' text-anchor='middle' fill='%239bc8d2' font-family='Arial' font-size='42' font-weight='700' letter-spacing='8'%3ECONCEPT 1%3C/text%3E%3C/svg%3E",
    promptSummary: "Mock concept preview",
  },
  {
    id: "default-2",
    imageUrl:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 1125'%3E%3Cdefs%3E%3CradialGradient id='g' cx='50%25' cy='42%25' r='65%25'%3E%3Cstop stop-color='%23284d5c'/%3E%3Cstop offset='.54' stop-color='%2309141c'/%3E%3Cstop offset='1' stop-color='%2303080d'/%3E%3C/radialGradient%3E%3Cfilter id='blur'%3E%3CfeGaussianBlur stdDeviation='8'/%3E%3C/filter%3E%3C/defs%3E%3Crect width='900' height='1125' rx='62' fill='url(%23g)'/%3E%3Cpath d='M428 275c126 11 213 101 207 221-5 104-77 156-176 203-58 28-90 57-95 108h293' fill='none' stroke='%237ee8ff' stroke-width='72' stroke-linecap='round' stroke-linejoin='round' filter='url(%23blur)' opacity='.28'/%3E%3Cpath d='M428 275c126 11 213 101 207 221-5 104-77 156-176 203-58 28-90 57-95 108h293' fill='none' stroke='%237ee8ff' stroke-width='34' stroke-linecap='round' stroke-linejoin='round' opacity='.9'/%3E%3Cpath d='M255 896h390' stroke='%237ee8ff' stroke-width='8' stroke-linecap='round' opacity='.32'/%3E%3Cellipse cx='450' cy='940' rx='290' ry='35' fill='%237ee8ff' opacity='.08'/%3E%3Cg fill='%237ee8ff' opacity='.72'%3E%3Ccircle cx='279' cy='370' r='4'/%3E%3Ccircle cx='318' cy='288' r='5'/%3E%3Ccircle cx='612' cy='292' r='4'/%3E%3Ccircle cx='681' cy='435' r='4'/%3E%3Ccircle cx='529' cy='774' r='5'/%3E%3C/g%3E%3Ctext x='450' y='996' text-anchor='middle' fill='%239bc8d2' font-family='Arial' font-size='43' font-weight='700' letter-spacing='8'%3ECONCEPT 2%3C/text%3E%3C/svg%3E",
    promptSummary: "Mock concept preview",
  },
];

export default App;
