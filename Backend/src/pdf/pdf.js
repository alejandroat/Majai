const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

function injectData(template, data) {
    let html = template;

    Object.keys(data).forEach(key => {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        html = html.replace(regex, data[key] ?? '');
    })
    return html;
}

async function generatePDF(templateName, data) {
    const templatePath = path.join(
        __dirname,
        'templates',
        templateName
    );

    const cssPath = path.join(
        __dirname,
        'styles',
        'pdf.css'
    );

    const htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    const css = fs.readFileSync(cssPath, 'utf8');

    let html = injectData(htmlTemplate, data);

    html = html.replace('</head>', `<style>${css}</style></head>`);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
            top: '20mm',
            bottom: '20mm',
            left: '15mm',
            right: '15mm'
        }
    });

    await browser.close();

    // Convertir a Buffer de Node.js para asegurar compatibilidad con toString('base64')
    const nodeBuffer = Buffer.from(pdfBuffer);
    console.log('PDF generado exitosamente, tamaño:', nodeBuffer.length, 'bytes');
    return nodeBuffer;
    
}

async function generateAlquilerPDF(data) {
  return generatePDF('alquiler.html', data);
}

async function generateAbonoPDF(data) {
  return generatePDF('abono.html', data);
}


module.exports = {
  generateAlquilerPDF,
  generateAbonoPDF
};