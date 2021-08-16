module.exports = {
  username: process.env.TEXTNOW_USERNAME || "",
  password: process.env.TEXTNOW_PASSWORD || "",
  recipient: process.env.TEXTNOW_RECIPIENT || "",
  message: process.env.TEXTNOW_MESSAGE || "",
  cookies_str: process.env.TEXTNOW_COOKIES || ""
};
