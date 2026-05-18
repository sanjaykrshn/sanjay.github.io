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
  pdfFrame: document.querySelector("#pdfFrame"),
  resumeText: document.querySelector("#resumeText"),
  copyButton: document.querySelector("#copyResumeButton"),
  copyStatus: document.querySelector("#copyStatus")
};

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
  els.pdfFrame.src = `${config.pdf}#view=FitH`;
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
    applyConfig(config);
    els.resumeText.textContent = (await fetchText(config.text)).trim();
  } catch (error) {
    els.copyStatus.textContent = "Resume files could not be loaded.";
    els.resumeText.textContent = error.message;
  }
}

els.copyButton.addEventListener("click", copyResumeText);
init();
