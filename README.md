# Sanjay Krishnan GitHub Pages

Minimal static resume site for GitHub Pages.

## Update The Resume

Replace these files with the latest exported versions:

- `assets/resume.pdf`
- `assets/resume.docx`
- `assets/resume.txt`
- `assets/resume-preview.png`

If filenames or profile copy change, update `resume-config.json`. The page reads the PDF, DOCX, and copyable text from that config, so the resume content is not hardcoded into `index.html`.

To rebuild from a DOCX locally:

```sh
cp ~/Downloads/Sanjay_Krishnan_Resume_v2.docx assets/resume.docx
soffice --headless --convert-to pdf --outdir assets assets/resume.docx
textutil -convert txt -stdout assets/resume.docx > assets/resume.txt
pdftoppm -png -singlefile -r 144 assets/resume.pdf assets/resume-preview
```
