const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Copiar archivos de fuentes de pdfkit
function copyPdfkitFonts() {
  const targetDir = path.join(__dirname, '.next/server/vendor-chunks/data');
  const sourceDir = path.join(__dirname, 'node_modules/pdfkit/js/data');

  if (fs.existsSync(sourceDir)) {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    try {
      execSync(`cp -r ${sourceDir}/* ${targetDir}/`, { stdio: 'inherit' });
      console.log('✓ PDFKit fonts copied successfully');
    } catch (error) {
      console.error('Error copying PDFKit fonts:', error);
    }
  }
}

app.prepare().then(() => {
  // Copiar fuentes después de que Next.js haya compilado
  copyPdfkitFonts();
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> DTF Print Services ready on http://${hostname}:${port}`);
    });
});
