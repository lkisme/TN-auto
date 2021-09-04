/**
 * Log into TextNow and get cookies
 * @param {object} page Puppeteer browser page
 * @param {object} client Puppeteer CDPSession
 * @param {string} username Optional account credential
 * @param {string} password Optional account credential
 * @return {object} Updated login cookies
 */
module.exports.logIn = async (page, client, username, password) => {
  await Promise.all([
    page.goto("https://www.textnow.com/login",{waitUntil: "networkidle0"}),
    //page.waitForNavigation({ waitUtil: "networkidle0" }),
  ]);

/*  if (username && password) {
    await page.type("#txt-username", username);
    await page.type("#txt-password", password);

    const logInButton = await page.waitForSelector("#btn-login");
    await Promise.all([logInButton.click(), page.waitForNavigation()]);

    const cookies = (await client.send("Network.getAllCookies")).cookies;

    return cookies;
  }
*/
  await page.waitForTimeout(10000);
  const isLoggedIn = page.url().includes("/messaging");
  if (!isLoggedIn) {
    throw new Error("Deteacted invalid or expires cookies");
  }

  const cookies = (await client.send("Network.getAllCookies")).cookies;

  return cookies;
};

/**
 * Select a conversation using recipient info
 * @param {object} page Puppeteer browser page
 * @param {string} recipient Recipient info
 */
module.exports.selectConversation = async (page, recipient) => {
  await Promise.all([
    page.goto("https://www.textnow.com/messaging",{waitUntil: "networkidle0"}),
    //page.waitForNavigation({ waitUtil: "networkidle2" }),
  ]);

  await page.waitForTimeout(5000);

  try{
      await page.click('#newText');
      //await page.$eval("#newText", (element) => element.click());
  }catch(error){
      console.log(`Failed to find selector "#newText"! ` + error);
      process.exit(1);
  }

  await page.waitForTimeout(1500);
  
  try{
      const recipientField = await page.waitForSelector(".newConversationTextField");
  }catch(error){
      console.log(`Failed to find selector ".newConversationTextField"! ` + error);
      process.exit(1);
  }  
  
  await page.waitForTimeout(1500);
  await recipientField.type(recipient);
  await page.waitForTimeout(1500);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(3000);
};

/**
 * Send a message to the current recipient
 * @param {object} page Puppeteer browser page
 * @param {string } message Message content
 */
module.exports.sendMessage = async (page, message) => {
  const messageField = await page.waitForSelector("#text-input");
  await page.waitForTimeout(1500);
  await messageField.type(message);
  await page.waitForTimeout(1500);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(5000);
};
