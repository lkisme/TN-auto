(async () => {
  const puppeteer = require('puppeteer-extra');
  const StealthPlugin = require('puppeteer-extra-plugin-stealth');
  puppeteer.use(StealthPlugin());
  const crypto = require('crypto');
  const path = require("path");
  const fs = require("fs");
  const axios = require('axios');
  
  const Xvfb = require('xvfb');
  var xvfb = new Xvfb();

  const barkURL = process.env.BARK_URL;
  const browser = await puppeteer.launch({
    headless: false,
  });
  var recipient = "";
  var codeNum = "";

  console.log("start...");

  for (var i = 0; i < 4; i++) {
    var a = Math.floor(Math.random() * 9);
    codeNum += a;
  }
  const message = "Code: " + codeNum;
  
  // Get recipient number
  try {
    console.log("Get recipient number...");
    const page0 = await browser.newPage();
    await page0.goto("https://yunduanxin.net/US-Phone-Number/", { waitUtil: "networkidle2" });
    await page0.waitForSelector('div[class="number-boxes"] div:nth-child(1) .row .number-boxes-item-number')
    recipient = await page0.$eval('div[class="number-boxes"] div:nth-child(1) .row .number-boxes-item-number', node => node.innerText)
    if (!recipient.match(/\+1 \d{10}/)) {
      axios.post(barkURL + '[Textnow] Failed to Get recipient number!?isArchive=1');
    } else {
      console.log("Succeed to Get recipient number.");
    }
  } catch (error) {
    console.log("Failed to Get recipient number.");
    axios.post(barkURL + '[Textnow] Failed to Get recipient number!?isArchive=1');
  }


  xvfb.startSync();
  
  try {
/*      const randomTime = Math.floor(Math.random() * (300000 - 60000 + 1) + 60000);
      console.log("randomTime= " + randomTime);
      await page.waitForTimeout(randomTime);*/
    
    //console.log("1");
    const page = await browser.newPage();
    //console.log("2");
    const cookies_secret = eval(process.env.TEXTNOW_COOKIES);
    //console.log("3");
    const md5 = crypto.createHash('md5').update('textnow').digest('hex');
    //console.log("4");
    var cookies = "";
    
    // Importing cached cookies from file
    console.log("Importing cached cookies...");
    try {
      const cookies_last = await JSON.parse(fs.readFileSync(
        path.resolve(__dirname, ".cache/" + md5 + "_cache.json")
      ));
      console.log(`Succeed to import cached cookies.`);
      cookies = cookies_last;
    } catch (error) {
      console.log("Failed to import cached cookies!");
      cookies = cookies_secret;
      axios.post(barkURL + '[Textnow] Failed to import cached cookies!?isArchive=1');
    }

    // Use cookies log into TextNow and get new cookies
    console.log("Logging in with existing cookies");
    await page.setCookie(...cookies);
    await page.goto("https://www.textnow.com/messaging", { waitUntil: "networkidle2" });

    try {
      await page.waitForSelector("#newText");
      console.log(`Succeed to sign in.`);
    } catch (err) {
      console.log(`Failed to sign in: ` + err);
      axios.post(barkURL + `[Textnow] Failed to sign in!?isArchive=1`);
      process.exit(1);
    }

    try {
      fs.writeFileSync(
        path.resolve(__dirname, ".cache/" + md5 + "_cache.json"),
        JSON.stringify(await page.cookies())
      );
      console.log(`Succeed to save cookies.`);
    } catch (err) {
      console.log(`Failed to save cookies. ` + err);
      axios.post(barkURL + `[Textnow] Failed to save cookies!?isArchive=1`);
    }

    // Select a conversation using recipient info
    console.log("Selecting conversation...");
    try {
      await page.waitForSelector('#newText');
      //await page.click('#newText'); //无头模式下，这种写法有时不灵?
      await page.evaluate(() => {
        document.getElementById("newText").click();
      });
      //console.log("1 done...");
    } catch (error) {
      console.log(`Failed to click selector "#newText"! ` + error);
      axios.post(barkURL + '[Textnow] Failed to click selector "#newText"!?isArchive=1');
      process.exit(1);
    }

    try {
      await page.waitForSelector('.newConversationTextField');
      await page.type('.newConversationTextField', recipient);
      //console.log("2 done...");
      //await page.$eval('.newConversationTextField', (recip, _recipient) => recip.value = _recipient, recipient);
      await page.waitForTimeout(1500);
      await page.keyboard.press("Enter");
      //console.log("3 done...");
      await page.waitForTimeout(3000);
      console.log("Succeed to select conversation.");
    } catch (error) {
      console.log(`Failed to find selector ".newConversationTextField"! ` + error);
      axios.post(barkURL + '[Textnow] Failed to find selector ".newConversationTextField"!?isArchive=1');
      process.exit(1);
    }

    // Send a message to the current recipient
    console.log("Sending message...");
    try {
      await page.waitForSelector('#text-input');
      await page.type('#text-input', message);
      //console.log("4 done...");
      await page.waitForTimeout(1500);
      try {
        //await page.click('#text-input'); //无头模式下，这种写法有时不灵?
        await page.evaluate(() => {
          document.getElementById("text-input").click();
        });
        await page.keyboard.press("Enter");
      } catch (error) {
        console.log("send error :" + error);
      }
      await page.waitForTimeout(3500);
      console.log("Succeed to send a message.");
    } catch (error) {
      console.log(`Failed to send message! ` + error);
      axios.post(barkURL + '[Textnow] Failed to send message!?isArchive=1');
      process.exit(1);
    }

    await browser.close();

  } catch (error) {
    console.log(error);
    axios.post(barkURL + '[Textnow]: ' + error);
    process.exit(1);
  }

})();


xvfb.stopSync();
