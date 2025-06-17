const puppeteer = require("puppeteer");
const prompt = require("prompt-sync")();
const fs = require("fs");
const path = require("path");
const { log, error } = require("console");

// Configuration
const CONFIG = {
  url: "https://centralnovel.com/",
  selectors: {
    searchInput: "#s",
    novelLink: ".tip",
    chapterList: "div.ts-chl-collapsible-content a",
    content: ".epcontent.entry-content",
    title: "h1.entry-title"
  },
  outputDir: "Downloads"
};

// Utility functions
const createDirectory = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (err) {
    error(`Failed to create directory: ${err.message}`);
    return false;
  }
};

const sanitizeFilename = (filename) => {
  return filename.replace(/[\\/:*?"<>|]/g, '_');
};

const extractChapterNumber = (url) => {
  const match = url.match(/-capitulo-(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

const generateFilename = (novelName, startChapter, endChapter) => {
  return path.join(
    CONFIG.outputDir,
    `${sanitizeFilename(novelName)} Cap ${startChapter}-${endChapter}.txt`
  );
};

const processChapter = async (page, url, novelName, startChapter, endChapter) => {
  try {
    // Ensure we have a valid URL
    const chapterUrl = new URL(url, CONFIG.url);
    await page.goto(chapterUrl.href);
    await page.waitForSelector(CONFIG.selectors.content);

    const title = await page.$eval(CONFIG.selectors.title, el => el.textContent);
    log(`Processing chapter: ${title}`);

    const contentSelector = CONFIG.selectors.content;
    const titleSelector = CONFIG.selectors.title;

    const textContent = await page.evaluate((contentSelector, titleSelector) => {
      const div = document.querySelector(contentSelector);
      const elements = Array.from(div.querySelectorAll("p"));
      
      const text = new Set();
      text.add(document.querySelector(titleSelector).textContent);

      elements.forEach(element => {
        const cleanText = element.textContent.trim();
        if (cleanText) text.add(cleanText);
      });

      return Array.from(text);
    }, contentSelector, titleSelector);

    const fileName = generateFilename(novelName, startChapter, endChapter);
    fs.appendFileSync(fileName, textContent.join('\n') + '\n');
    log(`Saved content to: ${fileName}`);
  } catch (err) {
    error(`Failed to process chapter ${url}: ${err.message}`);
    throw err;
  }
};

// Main function
/**
 * Main application entry point
 */
const main = async () => {
  let browser;
  try {
    // Initialize browser and create page
    browser = await puppeteer.launch({
      headless: false,
      executablePath: '/usr/bin/google-chrome',
      defaultViewport: {
        width: 1280,
        height: 720,
        deviceScaleFactor: 1
      }
    });

    const page = await browser.newPage();
    await page.goto(CONFIG.url);

    // Get novel information
    const novelName = getNovelName();
    const novelLink = await findNovelLink(page, novelName);
    const chapterLinks = await getChapterLinks(page, novelLink);

    // Get chapter range
    const { startChapter, endChapter } = getChapterRange();
    const chapters = filterChapters(chapterLinks, startChapter, endChapter);

    // Create output directory
    createOutputDirectory();

    // Process chapters
    await processChapters(page, chapters, novelName, startChapter, endChapter);

    log("All chapters processed successfully!");

  } catch (err) {
    handleError(err);
  } finally {
    if (browser) await browser.close();
  }
};

/**
 * Gets the novel name from user input
 * @returns {string} Validated novel name
 */
const getNovelName = () => {
  const name = prompt("Nome da novel: ").trim();
  if (!name) {
    throw new Error("Novel name cannot be empty");
  }
  return name;
};

/**
 * Finds the novel link on the search page
 * @param {Page} page - Puppeteer page instance
 * @param {string} novelName - Name of the novel to search
 * @returns {Promise<string>} URL of the novel page
 */
const findNovelLink = async (page, novelName) => {
  await page.type(CONFIG.selectors.searchInput, novelName);
  await page.keyboard.press("Enter");
  await page.waitForNavigation();

  const link = await page.$eval(CONFIG.selectors.novelLink, el => el.href);
  if (!link) {
    throw new Error("No novel found with that name");
  }
  return link;
};

/**
 * Gets all chapter links from the novel page
 * @param {Page} page - Puppeteer page instance
 * @param {string} novelLink - URL of the novel page
 * @returns {Promise<string[]>} Array of chapter URLs
 */
const getChapterLinks = async (page, novelLink) => {
  await page.goto(novelLink);
  await page.waitForSelector(CONFIG.selectors.chapterList);
  
  return await page.$$eval(
    CONFIG.selectors.chapterList,
    links => links.map(link => link.href)
  );
};

/**
 * Gets chapter range from user input
 * @returns {{startChapter: number, endChapter: number}} Chapter range
 */
const getChapterRange = () => {
  const start = parseInt(prompt("Capítulo inicial: "), 10);
  const end = parseInt(prompt("Capítulo final: "), 10);

  if (isNaN(start) || isNaN(end) || start > end) {
    throw new Error("Invalid chapter range");
  }
  return { startChapter: start, endChapter: end };
};

/**
 * Filters chapters based on the specified range
 * @param {string[]} links - Array of chapter URLs
 * @param {number} start - Start chapter number
 * @param {number} end - End chapter number
 * @returns {string[]} Filtered chapter URLs
 */
const filterChapters = (links, start, end) => {
  return links
    .map(url => ({ url, chapter: extractChapterNumber(url) }))
    .filter(({ chapter }) => chapter !== null && chapter >= start && chapter <= end)
    .sort((a, b) => a.chapter - b.chapter)
    .map(({ url }) => url);
};

/**
 * Creates the output directory if it doesn't exist
 */
const createOutputDirectory = () => {
  if (!createDirectory(CONFIG.outputDir)) {
    throw new Error("Failed to create output directory");
  }
};

/**
 * Processes all chapters in sequence
 * @param {Page} page - Puppeteer page instance
 * @param {string[]} chapters - Array of chapter URLs
 * @param {string} novelName - Name of the novel
 * @param {number} startChapter - Start chapter number
 * @param {number} endChapter - End chapter number
 */
const processChapters = async (page, chapters, novelName, startChapter, endChapter) => {
  for (const url of chapters) {
    await processChapter(page, url, novelName, startChapter, endChapter);
  }
};

/**
 * Handles errors with proper logging
 * @param {Error} error - Error object
 */
const handleError = (error) => {
  console.error(`Error: ${error.message}`);
  console.error(error.stack);
};

main();
