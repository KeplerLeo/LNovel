const puppeteer = require('puppeteer');
const prompt = require('prompt-sync')();

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://centralnovel.com/series/the-beginning-after-the-end/');

  const vol = prompt('Volume: ');
  console.log(`Volume ${vol}`);

  await page.evaluate((vol) => {
    const spans = document.querySelectorAll('span.ts-chl-collapsible');
    console.log(spans);
    for (const span of spans) {
      console.log(span.textContent);
      if (span.textContent === `Volume ${vol}`) {
        span.click();
        break;
      }
    }
  }, vol);

  const end = prompt('End? ');

  await browser.close();
}
)();