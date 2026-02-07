const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const HTML_PATH = path.resolve(__dirname, '..', 'public', 'pitch-deck.html');
const OUTPUT_PATH = path.resolve(__dirname, '..', 'public', 'StellaRay-Pitch-Deck.pdf');

async function generatePDF() {
  console.log('Launching Edge...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();

  // Set 16:9 viewport (1920x1080)
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });

  // Load the HTML file
  const fileUrl = 'file:///' + HTML_PATH.replace(/\\/g, '/');
  console.log('Loading:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 2000));

  // Get total slide count
  const totalSlides = await page.evaluate(() => document.querySelectorAll('.slide').length);
  console.log(`Found ${totalSlides} slides`);

  // Capture each slide as a screenshot, then combine into PDF
  const screenshots = [];

  for (let i = 0; i < totalSlides; i++) {
    console.log(`Capturing slide ${i + 1}/${totalSlides}...`);

    // Activate the current slide
    await page.evaluate((slideIndex) => {
      // Hide all UI chrome
      document.querySelectorAll('.bottom-bar, .progress-bar, .nav-hint, .slide-dots, .keyboard-shortcuts').forEach(el => {
        el.style.display = 'none';
      });

      // Show only the target slide
      document.querySelectorAll('.slide').forEach((slide, idx) => {
        if (idx === slideIndex) {
          slide.classList.add('active');
          slide.style.display = 'flex';
        } else {
          slide.classList.remove('active');
          slide.style.display = 'none';
        }
      });
    }, i);

    // Small delay for rendering
    await new Promise(r => setTimeout(r, 500));

    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1920, height: 1080 },
    });

    screenshots.push(screenshot);
  }

  // Now create a PDF from all screenshots
  console.log('Generating PDF from screenshots...');

  // Create a new page with all slides as images
  const pdfPage = await browser.newPage();
  await pdfPage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });

  const imagesHtml = screenshots.map((buf, i) => {
    const b64 = buf.toString('base64');
    return `
      <div class="pdf-slide" style="
        width: 1920px;
        height: 1080px;
        page-break-after: always;
        page-break-inside: avoid;
        overflow: hidden;
        position: relative;
      ">
        <img src="data:image/png;base64,${b64}" style="
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        "/>
      </div>
    `;
  }).join('');

  await pdfPage.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0A0A0A; }
        @page {
          size: 1920px 1080px;
          margin: 0;
        }
        .pdf-slide:last-child {
          page-break-after: avoid;
        }
      </style>
    </head>
    <body>${imagesHtml}</body>
    </html>
  `, { waitUntil: 'networkidle0' });

  await pdfPage.pdf({
    path: OUTPUT_PATH,
    width: '1920px',
    height: '1080px',
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    printBackground: true,
    preferCSSPageSize: true,
  });

  await browser.close();
  console.log(`PDF saved to: ${OUTPUT_PATH}`);
  console.log(`File size: ${(fs.statSync(OUTPUT_PATH).size / 1024 / 1024).toFixed(2)} MB`);
}

generatePDF().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
