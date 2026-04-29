import { ChangeEvent, DragEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Concept, describeReferenceImages, generateConcepts } from "./api";

type UploadImage = {
  id: string;
  name: string;
  dataUrl: string;
};

const MAX_INSPIRATION_IMAGES = 5;
type OrientationOption = "landscape-4-3" | "landscape-16-9" | "vertical-9-16";

const ORIENTATION_PROMPTS: Record<OrientationOption, string> = {
  "landscape-4-3": "landscape orientation with a 4:3 aspect ratio",
  "landscape-16-9": "landscape orientation with a 16:9 aspect ratio",
  "vertical-9-16": "vertical orientation with a 9:16 aspect ratio",
};

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

type HeaderParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
};

function HeaderParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      return;
    }

    const parent = canvas.parentElement;
    if (!parent) {
      return;
    }

    const palette = ["#ff5f93", "#ffcc4d", "#7ce577", "#52d7ff", "#a981ff", "#ff8b4a", "#40bfa5"];
    const particles: HeaderParticle[] = [];
    const densityFactor = 2.6;
    const minimumParticles = 260;
    const spawnPerFrame = 7;
    const turbulence = 0.016;
    const drag = 0.985;
    const topFadeDistance = 120;
    let rafId = 0;
    let width = 0;
    let height = 0;
    let maxParticles = minimumParticles;
    let lastFrameTime = performance.now();

    function randomBetween(min: number, max: number) {
      return min + Math.random() * (max - min);
    }

    function resizeCanvas() {
      const devicePixelRatio = window.devicePixelRatio || 1;
      const bounds = parent.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      maxParticles = Math.max(minimumParticles, Math.floor((width * height * densityFactor) / 1000));
      canvas.width = Math.max(1, Math.floor(width * devicePixelRatio));
      canvas.height = Math.max(1, Math.floor(height * devicePixelRatio));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    function createParticle() {
      const spawnBand = Math.max(36, height * 0.2);
      const radius = randomBetween(1, 4);
      particles.push({
        x: randomBetween(0, width),
        y: randomBetween(height - spawnBand, height + 16),
        vx: randomBetween(-0.28, 0.28),
        vy: randomBetween(-1.4, -0.45),
        radius,
        alpha: randomBetween(0.45, 0.95),
        life: 0,
        maxLife: randomBetween(1300, 3000),
        color: palette[Math.floor(Math.random() * palette.length)],
      });
    }

    function updateAndDrawParticle(particle: HeaderParticle, deltaMs: number) {
      const deltaMultiplier = deltaMs / 16.6667;
      particle.life += deltaMs;
      particle.vx += randomBetween(-turbulence, turbulence) * deltaMultiplier;
      particle.vy -= randomBetween(0.0008, 0.0025) * deltaMs;
      particle.vx *= drag;
      particle.vy *= drag;
      particle.x += particle.vx * deltaMultiplier * 2.4;
      particle.y += particle.vy * deltaMultiplier * 2.4;

      const lifeFade = 1 - particle.life / particle.maxLife;
      const topFade = Math.min(1, Math.max(0, particle.y / topFadeDistance));
      const opacity = particle.alpha * Math.min(lifeFade, topFade);
      if (opacity <= 0) {
        return false;
      }

      context.globalAlpha = opacity;
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
      return true;
    }

    function animate(currentTime: number) {
      const deltaMs = Math.min(40, currentTime - lastFrameTime || 16.6667);
      lastFrameTime = currentTime;

      context.clearRect(0, 0, width, height);

      if (particles.length < maxParticles) {
        for (let count = 0; count < spawnPerFrame; count += 1) {
          createParticle();
        }
      }

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        const isVisible = updateAndDrawParticle(particle, deltaMs);
        if (!isVisible || particle.y < -24 || particle.x < -24 || particle.x > width + 24) {
          particles.splice(index, 1);
        }
      }

      rafId = window.requestAnimationFrame(animate);
    }

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(parent);
    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, []);

  return <canvas className="hero-particle-canvas" ref={canvasRef} aria-hidden="true" />;
}

function App() {
  const [logo, setLogo] = useState<UploadImage | null>(null);
  const [inspirationImages, setInspirationImages] = useState<UploadImage[]>([]);
  const [referenceImageDescription, setReferenceImageDescription] = useState("");
  const [referenceDescriptionStatus, setReferenceDescriptionStatus] = useState<"idle" | "describing" | "error">("idle");
  const [hasGeneratedReferenceDescription, setHasGeneratedReferenceDescription] = useState(false);
  const [campaignPrompt, setCampaignPrompt] = useState("");
  const [logoModifierEnabled, setLogoModifierEnabled] = useState(false);
  const [logoModifierPrompt, setLogoModifierPrompt] = useState("");
  const [orientationModifierEnabled, setOrientationModifierEnabled] = useState(false);
  const [orientation, setOrientation] = useState<OrientationOption>("landscape-4-3");
  const [preventTextModifierEnabled, setPreventTextModifierEnabled] = useState(false);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<{ imageUrl: string; alt: string } | null>(null);
  const [status, setStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [generationErrorMessage, setGenerationErrorMessage] = useState("");
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
      setHasGeneratedReferenceDescription(false);
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
        setHasGeneratedReferenceDescription(true);
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
    setGenerationErrorMessage("");
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
    setGenerationErrorMessage("");
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
    setGenerationErrorMessage("");
  }

  async function handleGenerate() {
    if (!campaignPrompt.trim()) {
      setStatus("error");
      setGenerationErrorMessage("");
      return;
    }

    setStatus("generating");
    setGenerationErrorMessage("");

    try {
      const logoInstruction = logoModifierEnabled
        ? logoModifierPrompt.trim()
          ? `\n\nLogo modifier: ${logoModifierPrompt.trim()}`
          : ""
        : "\n\nLogo modifier: Do not include any logos, brand marks, brand names, trademarks, labels, signage, or branding of any kind in the generated image.";
      const orientationInstruction = orientationModifierEnabled
        ? `\n\nOrientation modifier: Create the image in ${ORIENTATION_PROMPTS[orientation]}.`
        : "";
      const preventTextInstruction = preventTextModifierEnabled
        ? "\n\nText prevention modifier: Do not include any readable text, words, letters, numbers, typography, labels, or captions in the generated image, even if text appears in the reference images or the campaign prompt."
        : "";
      const styleDescriptionInstruction = referenceImageDescription.trim()
        ? `\n\nStyle description extracted from reference images:\n${referenceImageDescription.trim()}`
        : "";
      const nextConcepts = await generateConcepts({
        logo: logoModifierEnabled ? logo?.dataUrl ?? null : null,
        inspirationImages: inspirationImages.map((image) => image.dataUrl),
        campaignPrompt: `${campaignPrompt}${styleDescriptionInstruction}${logoInstruction}${orientationInstruction}${preventTextInstruction}`,
      });
      setConcepts(nextConcepts);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setGenerationErrorMessage(error instanceof Error ? error.message : "The visuals could not be generated. Try again.");
    }
  }

  return (
    <>
      <main className="app-shell">
      <header className="hero">
        <HeaderParticles />
        <h1>BrandSeed</h1>
        <p>Create unique brand-aligned imagery</p>
      </header>

      <section className="workspace" aria-label="Campaign image generator">
        <div className="creative-grid">
          <div className="panel inspiration-panel">
            <div className="section-heading">
              <span>Style references</span>
              <p>Select images that capture your visual style.</p>
            </div>

            <div className={`reference-upload-stack ${inspirationImages.length >= MAX_INSPIRATION_IMAGES ? "is-full" : ""}`}>
              {inspirationImages.length < MAX_INSPIRATION_IMAGES ? (
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
              ) : null}

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

          <div className="prompt-section prompt-panel">
            <div className="section-heading prompt-heading">
              <label htmlFor="campaign-prompt">Your Image</label>
              <p>Describe what's in your image (the brand styling will be applied).</p>
            </div>
            <textarea
              id="campaign-prompt"
              value={campaignPrompt}
              placeholder="Describe the image you want to create"
              onChange={(event) => setCampaignPrompt(event.target.value)}
            />
          </div>
        </div>

        <div className="style-modifiers-grid prompt-section">
          {referenceDescriptionStatus === "describing" ? (
            <section className="reference-description-section reference-description-loading" aria-live="polite">
              <div className="section-heading reference-description-heading">
                <div className="reference-description-title">
                  <span>Determining style</span>
                  <span className="reference-description-spinner" aria-label="Loading" />
                </div>
              </div>
            </section>
          ) : null}

          {referenceDescriptionStatus === "idle" && inspirationImages.length > 0 && hasGeneratedReferenceDescription ? (
            <section className="reference-description-section">
              <div className="section-heading reference-description-heading">
                <div className="reference-description-title">
                  <span>Style description</span>
                  <span aria-label="Complete">
                    <CheckIcon />
                  </span>
                </div>
                <p>The description of the style generated from your reference images. It will be used to create your new images – feel free to adjust.</p>
              </div>
              <textarea
                ref={referenceDescriptionRef}
                id="reference-description"
                value={geminiReferenceDescriptionHook.value}
                onChange={(event) => geminiReferenceDescriptionHook.setDescription(event.target.value)}
                data-gemini-hook="reference-image-description"
                placeholder="Description of style"
                aria-label="Gemini reference image description"
              />
            </section>
          ) : null}

          <section className="modifiers-section">
            <div className="section-heading">
              <span>Modifiers</span>
              <p>Specify additional details for your image.</p>
            </div>

            <div className="modifier-list">
              <div className={`modifier-item ${logoModifierEnabled ? "is-active" : ""}`}>
                <label className="modifier-toggle">
                  <input
                    type="checkbox"
                    checked={logoModifierEnabled}
                    onChange={(event) => setLogoModifierEnabled(event.target.checked)}
                  />
                  <span>Logo</span>
                </label>

                {logoModifierEnabled ? (
                  <div className="modifier-active-content logo-modifier-content">
                    <button
                      className={`drop-zone modifier-logo-drop ${logo ? "has-image" : ""}`}
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={handleLogoDrop}
                      aria-label="Upload logo for modifier"
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
                    <textarea
                      className="modifier-textarea"
                      value={logoModifierPrompt}
                      placeholder="Describe how to use the logo (required)"
                      onChange={(event) => setLogoModifierPrompt(event.target.value)}
                      aria-label="Logo modifier instructions"
                    />
                  </div>
                ) : null}
              </div>

              <div className={`modifier-item ${orientationModifierEnabled ? "is-active" : ""}`}>
                <label className="modifier-toggle">
                  <input
                    type="checkbox"
                    checked={orientationModifierEnabled}
                    onChange={(event) => setOrientationModifierEnabled(event.target.checked)}
                  />
                  <span>Orientation</span>
                </label>

                {orientationModifierEnabled ? (
                  <div className="modifier-active-content orientation-options" role="radiogroup" aria-label="Image orientation">
                    <label>
                      <input
                        type="radio"
                        name="orientation"
                        value="landscape-4-3"
                        checked={orientation === "landscape-4-3"}
                        onChange={() => setOrientation("landscape-4-3")}
                      />
                      <span>Landscape (4:3)</span>
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="orientation"
                        value="landscape-16-9"
                        checked={orientation === "landscape-16-9"}
                        onChange={() => setOrientation("landscape-16-9")}
                      />
                      <span>Landscape (16:9)</span>
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="orientation"
                        value="vertical-9-16"
                        checked={orientation === "vertical-9-16"}
                        onChange={() => setOrientation("vertical-9-16")}
                      />
                      <span>Vertical (9:16)</span>
                    </label>
                  </div>
                ) : null}
              </div>

              <div className={`modifier-item ${preventTextModifierEnabled ? "is-active" : ""}`}>
                <label className="modifier-toggle">
                  <input
                    type="checkbox"
                    checked={preventTextModifierEnabled}
                    onChange={(event) => setPreventTextModifierEnabled(event.target.checked)}
                  />
                  <span>Prevent text in image</span>
                </label>
              </div>
            </div>
          </section>
        </div>

        <input ref={logoInputRef} className="hidden-input" type="file" accept="image/*,.svg" onChange={handleLogoInput} />

        <div className="action-row">
          <button
            className={`generate-button ${status === "generating" ? "is-generating" : ""}`}
            type="button"
            disabled={status === "generating"}
            onClick={handleGenerate}
          >
            {status === "generating" ? "Creating..." : concepts.length ? "Recreate" : "Create"}
          </button>
          {generationErrorMessage ? (
            <p className="generation-error" role="alert">
              {generationErrorMessage}
            </p>
          ) : null}
        </div>

        {status === "generating" || concepts.length ? (
          <section className="concepts-section" aria-label="Your images">
            <div className="divider-title">
              <span />
              <h2>Your images</h2>
              <span />
            </div>

            <div className="concept-grid">
              {status === "generating"
                ? [1, 2].map((placeholderIndex) => (
                    <article className="concept-card concept-placeholder-card" key={`placeholder-${placeholderIndex}`} aria-label={`Creating image ${placeholderIndex}`}>
                      <div className="concept-placeholder" aria-hidden="true" />
                    </article>
                  ))
                : concepts.map((concept, index) => (
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
