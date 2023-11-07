const puppeteer = require('puppeteer');
const prompt = require('prompt-sync')();
const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');

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
      // adiciona o title antes do texto
      text.push(document.querySelector('h1.entry-title').textContent);
      paragraphs.forEach((p) => {
        text.push(p.textContent);
      });
      return text;
    });


    // salvar textContent em um arquivo txt
    if (!fs.existsSync('Downloads')) {
      fs.mkdirSync('Downloads');
    }

    const fileName = `Downloads/The Beginning After The End Cap ${start}-${end}.txt`;
    for (const line of textContent) {
      fs.appendFileSync(fileName, `${line}\n`);
    }
  }
  
  const finish = prompt('End? ');

  await browser.close();
})();
