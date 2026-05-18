const configPath = "resume-config.json";

const els = {
  updatedLabel: document.querySelector("#updatedLabel"),
  pageTitle: document.querySelector("#page-title"),
  summaryText: document.querySelector("#summaryText"),
  roleText: document.querySelector("#roleText"),
  locationText: document.querySelector("#locationText"),
  openPdfLink: document.querySelector("#openPdfLink"),
  downloadPdfLink: document.querySelector("#downloadPdfLink"),
  downloadDocxLink: document.querySelector("#downloadDocxLink"),
  pdfViewer: document.querySelector("#pdfViewer"),
  pdfCanvas: document.querySelector("#pdfCanvas"),
  pdfStatus: document.querySelector("#pdfStatus"),
  resumePreview: document.querySelector("#resumePreview"),
  resumeText: document.querySelector("#resumeText"),
  copyButton: document.querySelector("#copyResumeButton"),
  copyStatus: document.querySelector("#copyStatus")
};

let pdfDocument;
let activeRenderTask;
let currentConfig;

async function fetchText(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }
  return response.text();
}

function applyConfig(config) {
  document.title = `${config.name} | Resume`;
  els.updatedLabel.textContent = config.updated ? `Resume updated ${config.updated}` : "Resume";
  els.pageTitle.textContent = config.name;
  els.summaryText.textContent = config.summary;
  els.roleText.textContent = config.role;
  els.locationText.textContent = config.location;

  els.openPdfLink.href = config.pdf;
  els.downloadPdfLink.href = config.pdf;
  els.downloadDocxLink.href = config.docx;
  els.resumePreview.src = config.preview;
}

function showPreviewFallback(message) {
  els.pdfCanvas.hidden = true;
  els.resumePreview.style.display = "inline-block";
  els.pdfStatus.textContent = message;
}

async function renderPdf(config) {
  try {
    const pdfjsLib = await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

    pdfDocument ||= await pdfjsLib.getDocument(config.pdf).promise;
    const page = await pdfDocument.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const availableWidth = Math.max(280, els.pdfViewer.clientWidth - 44);
    const scale = availableWidth / baseViewport.width;
    const viewport = page.getViewport({ scale });
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const canvas = els.pdfCanvas;
    const context = canvas.getContext("2d");

    if (activeRenderTask) {
      activeRenderTask.cancel();
    }

    canvas.hidden = false;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    canvas.width = Math.floor(viewport.width * ratio);
    canvas.height = Math.floor(viewport.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, viewport.width, viewport.height);

    activeRenderTask = page.render({ canvasContext: context, viewport });
    await activeRenderTask.promise;
    activeRenderTask = null;
    els.resumePreview.style.display = "none";
    els.pdfStatus.textContent = "Rendered from the downloadable PDF.";
  } catch (error) {
    if (error?.name === "RenderingCancelledException") return;
    showPreviewFallback("Preview image shown. Use Open PDF for the native PDF viewer.");
  }
}

async function copyResumeText() {
  const text = els.resumeText.textContent.trim();
  if (!text || text === "Loading resume text...") return;

  try {
    await navigator.clipboard.writeText(text);
    els.copyStatus.textContent = "Resume text copied.";
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.inset = "0 auto auto 0";
    textarea.style.width = "1px";
    textarea.style.height = "1px";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();

    if (!copied) {
      const range = document.createRange();
      range.selectNodeContents(els.resumeText);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }

    els.copyStatus.textContent = copied ? "Resume text copied." : "Text selected. Press Command+C to copy.";
  }

  window.setTimeout(() => {
    els.copyStatus.textContent = "";
  }, 2600);
}

async function init() {
  try {
    const config = JSON.parse(await fetchText(configPath));
    currentConfig = config;
    applyConfig(config);
    renderPdf(config);
    els.resumeText.textContent = (await fetchText(config.text)).trim();
  } catch (error) {
    els.copyStatus.textContent = "Resume files could not be loaded.";
    els.resumeText.textContent = error.message;
  }
}

els.copyButton.addEventListener("click", copyResumeText);
window.addEventListener("resize", () => {
  window.clearTimeout(window.resumeResizeTimer);
  window.resumeResizeTimer = window.setTimeout(() => {
    if (currentConfig) renderPdf(currentConfig);
  }, 180);
});
init();
