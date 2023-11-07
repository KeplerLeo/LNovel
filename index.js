const puppeteer = require('puppeteer');
const prompt = require('prompt-sync')();

(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.goto('https://centralnovel.com/series/the-beginning-after-the-end/');

  const vol = prompt('Volume: ');
  console.log(`Volume ${vol}`);

  await browser.close();
}
)();