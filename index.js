(async () => {
  console.log("textnow bot start...");
  const path = require("path");
  const fs = require("fs").promises;
  const puppeteer = require('puppeteer-extra');
  const StealthPlugin = require('puppeteer-extra-plugin-stealth');
  puppeteer.use(StealthPlugin());
  const textNowHelper = require("./utils/helper");
  const config = require("./config");
  const crypto = require('crypto');
  const {
    // username,
    // password,
    recipient,
    message,
    cookies_str,
  } = config;

  let browser = null;
  let page = null;
  const md5 = crypto.createHash('md5').update(cookies_str).digest('hex');

  try {
    browser = await puppeteer.launch({ 
      headless: true
    });
    page = await browser.newPage();
    const client = await page.target().createCDPSession();
    let cookies = null;

    // Importing exsiting cookies from file
    try {
      console.log("Importing existing cookies...");
      const cookiesJSON = await fs.readFile(
        path.resolve(__dirname, ".cache/" + md5 + "_cookies.json")
      );
      cookies = JSON.parse(cookiesJSON);
    } catch (error) {
      console.log("Failed to import existing cookies.");
      if (cookies_str) cookies = parseCookies(cookies_str, 'www.textnow.com');
    }

    // Log into TextNow and get cookies
    try {
      console.log("Logging in with existing cookies");
      await page.setCookie(...cookies);
      cookies = await textNowHelper.logIn(page, client);
    } catch (error) {
      console.log("Failed to log in with existing cookies.");
      // console.log("Logging in with account credentials...");
      // cookies = await textNowHelper.logIn(page, client, username, password);
      process.exit(1);
    }

    try {
      console.log("Successfully logged into TextNow!");
      // Save cookies to file
      await fs.writeFile(
        path.resolve(__dirname, ".cache/" + md5 + "_cookies.json"),
        JSON.stringify(cookies)
      );
    } catch (error) {
      console.log("Failed to save cookies to file.");
    }

    // Select a conversation using recipient info
    console.log("Selecting conversation...");
    await textNowHelper.selectConversation(page, recipient);

    // Send a message to the current recipient
    console.log("Sending message...");
    await textNowHelper.sendMessage(page, message);

    console.log("Message sent!");
    await browser.close();
  } catch (error) {
    console.log(error);

    if (page) {
      await page.screenshot({ path: "./error-screenshot.jpg", type: "jpeg" });
    }

    if (browser) {
      await browser.close();
    }

    process.exit(1);
  }
})();

function parseCookies(cookies_str, domain) {
    return cookies_str.split(';').map(pair => {
        let name = pair.trim().slice(0, pair.trim().indexOf('='));
        let value = pair.trim().slice(pair.trim().indexOf('=') + 1);
        return { name, value, domain };
    });
};

