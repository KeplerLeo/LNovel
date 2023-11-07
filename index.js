//import puppeteer from 'puppeteer';
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.goto('https://centralnovel.com/series/the-beginning-after-the-end/');
  await page.waitFor(1000);

  //Get the title of the page
  const title = await page.title();
  console.log('Title: ' + title);

  //Get the url of the page
  const url = await page.url();
  console.log('URL: ' + url);

  //Get the text content of the page
  const text = await page.content();
  console.log('Text: ' + text);

  await browser.close();
}
)();