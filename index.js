const puppeteer = require('puppeteer');
const prompt = require('prompt-sync')();

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://centralnovel.com/series/the-beginning-after-the-end/');

  const vol = prompt('Volume: ');
  console.log(`Volume ${vol}`);

  const spans = await page.$$('span.ts-chl-collapsible');
  for (const span of spans) {
    const spanText = await page.evaluate(el => el.textContent, span);
    console.log(spanText);
    if (spanText === "Volume  " + vol) {
      await span.click();
    }
  }
  
  const end = prompt('End? ');

  await browser.close();
}
)();