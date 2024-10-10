const puppeteer = require("puppeteer");
const prompt = require("prompt-sync")();
const fs = require("fs");
const { log } = require("console");

(async () => {
  const browser = await puppeteer.launch({ headless: false, executablePath: '/usr/bin/google-chrome' });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
  });
  await page.goto("https://centralnovel.com/");

  const search = prompt("Nome da novel: ");
  await page.type("#s", search);
  await page.keyboard.press("Enter");
  await page.waitForNavigation();

  const novelLink = await page.$eval(".tip", (tip) => tip.getAttribute("href"));

  await page.goto(novelLink);

  await page.waitForSelector("div.ts-chl-collapsible-content a");

  const links = await page.$$eval(
    "div.ts-chl-collapsible-content a",
    (links) => {
      const urls = [];
      for (const link of links) {
        const href = link.getAttribute("href");
        urls.push(href);
      }
      return urls;
    }
  );

  links.forEach((link) => console.log(link));

  const start = prompt("Capítulo inicial: ");
  const end = prompt("Capítulo final: ");

  const regex = new RegExp(`-capitulo-(\\d+)`);
  const urlsNoIntervalo = links.filter((url) => {
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

    // Wait for the content to load
    await page.waitForSelector(".epcontent.entry-content");

    const title = await page.$eval(
      "h1.entry-title",
      (title) => title.textContent
    );
    console.log(title);

    const textContent = await page.evaluate(() => {
      const div = document.querySelector(".epcontent.entry-content");
      const paragraphs = Array.from(div.querySelectorAll("p"));
      const divs = Array.from(
        div.querySelectorAll('div[style="text-align: justify;"]')
      );

      // Combine paragraphs and divs into one array
      const elements = [...paragraphs, ...divs];

      const text = new Set();
      text.add(document.querySelector("h1.entry-title").textContent);

      elements.forEach((element) => {
        // Check if the element is a div
        if (element.tagName.toLowerCase() === "div") {
          // Split the innerHTML by <br> tags and add each part as a separate line
          const lines = element.innerHTML.split("<br>");
          lines.forEach((line) => {
            // Remove any remaining HTML tags and trim whitespace
            const cleanLine = line.replace(/<[^>]*>?/gm, "").trim();
            if (cleanLine) {
              text.add(cleanLine);
            }
          });
        } else {
          // If the element is not a div, just add its text content
          text.add(element.textContent);
        }
      });

      return Array.from(text);
    });

    if (!fs.existsSync("Downloads")) {
      fs.mkdirSync("Downloads");
    }

    const fileName = `Downloads/${search} Cap ${start}-${end}.txt`;
    for (const line of textContent) {
      fs.appendFileSync(fileName, `${line}\n`);
    }
  }

  const finish = prompt("End? ");

  await browser.close();
})();
