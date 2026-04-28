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

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6.4 5 12.6 12.6-1.4 1.4L5 6.4 6.4 5Z" />
      <path d="M17.6 5 19 6.4 6.4 19 5 17.6 17.6 5Z" />
    </svg>
  );
}

function RemoveImageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="remove-image-icon">
      <circle cx="12" cy="12" r="11" />
      <line x1="8" y1="8" x2="16" y2="16" />
      <line x1="16" y1="8" x2="8" y2="16" />
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
  const [selectedConcept, setSelectedConcept] = useState<{ imageUrl: string; alt: string } | null>(null);
  const [status, setStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
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

  useEffect(() => {
    if (!selectedConcept) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedConcept(null);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedConcept]);

  async function setLogoFile(file: File) {
    if (!isImage(file)) {
      setStatus("error");
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    setLogo({ id: crypto.randomUUID(), name: file.name, dataUrl });
    setStatus("idle");
  }

  async function addInspirationFiles(fileList: FileList | File[]) {
    const remainingSlots = MAX_INSPIRATION_IMAGES - inspirationImages.length;
    const files = Array.from(fileList).filter(isImage).slice(0, remainingSlots);

    if (files.length === 0) {
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

  function clearInspirationImages() {
    setInspirationImages([]);
    setStatus("idle");
  }

  async function handleGenerate() {
    if (!campaignPrompt.trim()) {
      setStatus("error");
      return;
    }

    setStatus("generating");

    try {
      const nextConcepts = await generateConcepts({
        logo: logo?.dataUrl ?? null,
        inspirationImages: inspirationImages.map((image) => image.dataUrl),
        campaignPrompt,
      });
      setConcepts(nextConcepts);
      setStatus("success");
    } catch (error) {
      setStatus("error");
    }
  }

  return (
    <>
      <main className="app-shell">
      <header className="hero">
        <h1>BrandBloom</h1>
        <p>Create unique brand-aligned imagery</p>
      </header>

      <section className="workspace" aria-label="Campaign image generator">
        <div className="upload-grid">
          <div className="panel logo-panel">
            <div className="section-heading">
              <span>Upload logo</span>
              <p>Upload your logo to include it in images.</p>
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
                  <strong>Drag & drop logo</strong>
                </>
              )}
            </button>
            <input ref={logoInputRef} className="hidden-input" type="file" accept="image/*,.svg" onChange={handleLogoInput} />
          </div>

          <div className="panel inspiration-panel">
            <div className="section-heading">
              <span>Add brand style references</span>
              <p>Select up to five images that capture your desired visual style.</p>
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
                        <RemoveImageIcon />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="inspiration-tile empty"
                      key={`slot-${index}`}
                      aria-hidden="true"
                    >
                      <PhotoIcon />
                    </div>
                  ),
                )}
              </div>

              {inspirationImages.length ? (
                <button className="clear-references-button" type="button" onClick={clearInspirationImages}>
                  Clear all
                </button>
              ) : null}
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
            Reference image description (debug)
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
          <label htmlFor="campaign-prompt">Describe the image you want</label>
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
        </div>

        {concepts.length ? (
          <section className="concepts-section" aria-label="Your images">
            <div className="divider-title">
              <span />
              <h2>Your images</h2>
              <span />
            </div>

            <div className="concept-grid">
              {concepts.map((concept, index) => (
                <article className="concept-card" key={concept.id}>
                  <button
                    className="concept-image-button"
                    type="button"
                    onClick={() => setSelectedConcept({ imageUrl: concept.imageUrl, alt: `Concept ${index + 1}` })}
                    aria-label={`Open concept ${index + 1} fullscreen`}
                  >
                    <img src={concept.imageUrl} alt={`Concept ${index + 1}`} />
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </section>
      </main>

      {selectedConcept ? (
        <div className="image-overlay" role="dialog" aria-modal="true" aria-label={selectedConcept.alt} onClick={() => setSelectedConcept(null)}>
          <button className="image-overlay-close" type="button" onClick={() => setSelectedConcept(null)} aria-label="Close fullscreen image">
            <CloseIcon />
          </button>
          <img src={selectedConcept.imageUrl} alt={selectedConcept.alt} onClick={(event) => event.stopPropagation()} />
        </div>
      ) : null}
    </>
  );
}

export default App;
