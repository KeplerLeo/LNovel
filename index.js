const puppeteer = require('puppeteer');
const prompt = require('prompt-sync')();
const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');

function splitTextIntoLines(text, font, fontSize, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine === '' ? word : `${currentLine} ${word}`;
    const width = font.widthOfTextAtSize(testLine, fontSize);

    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://centralnovel.com/series/the-beginning-after-the-end/');

  const start = prompt('Capítulo inicial: ');
  const end = prompt('Capítulo final: ');

  const links = await page.$$eval('div.ts-chl-collapsible-content a', links => {
    const urls = [];
    for (const link of links) {
      const href = link.getAttribute('href');
      urls.push(href);
    }
    return urls;
  });

  const regex = new RegExp(`-capitulo-(\\d+)`);
  const urlsNoIntervalo = links.filter(url => {
    const match = url.match(regex);
    if (match) {
      const numeroCapitulo = parseInt(match[1], 10);
      return numeroCapitulo >= start && numeroCapitulo <= end;
    }
    return false;
  });

  urlsNoIntervalo.reverse();

  for (const url of urlsNoIntervalo) {
    await page.goto(url);
    const title = await page.$eval('h1.entry-title', title => title.textContent);
    console.log(title);
    const textContent = await page.evaluate(() => {
      const div = document.querySelector('.epcontent.entry-content');
      const paragraphs = div.querySelectorAll('p');
      const text = [];
      paragraphs.forEach((p) => {
        text.push(p.textContent);
      });
      return text;
    });
    const pdfDoc = await PDFDocument.create();
    const firstPage = pdfDoc.addPage([600, 800]); // Tamanho da página
    const { width, height } = firstPage.getSize();
    const fontSize = 12;
    const padding = 50;
    const textWidth = width - 2 * padding;
    let y = height - padding;
    let currentPage = firstPage;

    for (const line of textContent) {
      const textWidth = width - 2 * padding;
      const font = await pdfDoc.embedFont('Helvetica');
      const availableSpace = y - padding;

      // Divide o texto em várias linhas, se necessário
      const lines = splitTextIntoLines(line, font, fontSize, textWidth);

      for (const textLine of lines) {
        if (y - fontSize < 0) {
          // O texto não cabe na página atual, crie uma nova página
          currentPage = pdfDoc.addPage([width, height]);
          y = height - padding;
        }

        currentPage.drawText(textLine, {
          x: padding,
          y,
          size: fontSize,
          color: rgb(0, 0, 0),
          width: textWidth,
        });

        y -= fontSize;
      }

      y -= 18; // Espaçamento entre linhas
    }

    // Salve o PDF em um arquivo
    const pdfBytes = await pdfDoc.save();
    if (!fs.existsSync('Downloads')) {
      fs.mkdirSync('Downloads');
    }
    fs.writeFileSync(`Downloads/${`The Beginning After The End Cap ${start}-${end}.pdf`}`, pdfBytes);
  }
  const finish = prompt('End? ');

  await browser.close();
}
)();