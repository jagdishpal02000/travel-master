const puppeteer = require('puppeteer');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();
const {modifyAndSaveImage} = require('./modules/change-bg');
const {recognizeCaptcha} = require('./modules/captcha-js');

const userName = process.env.IRCTC_USERNAME;
const password = process.env.IRCTC_PASSWORD;


// Main function to execute the scraping
async function main() {
  const browser = await puppeteer.launch({ headless: false, args: ['--start-maximized'] });
  const page = await browser.newPage();

  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('https://www.irctc.co.in/nget/train-search');

  try {
    await page.waitForSelector('a.search_btn.loginText', { visible: true, timeout: 5000 });
    await page.click('a.search_btn.loginText');

  } catch (error) {
    console.error('Timeout: Button element not found or not clickable');
    await browser.close();
    return;
  }

  try {
    await page.waitForSelector('img.captcha-img', { visible: true, timeout: 50000 });
  } catch (error) {
    console.error('Timeout: Image element not found');
    await browser.close();
    return;
  }

  const imageSrc = await page.$eval('img.captcha-img', (img) => img.src);
  const imageData = imageSrc.split(';base64,').pop();

  const imagePath = await modifyAndSaveImage(imageData);
  const captchaText = await recognizeCaptcha(imagePath);

  console.log('Captcha:', captchaText);

  const userNameInput = await page.$('input[formcontrolname^="user"]');
  await userNameInput.type(userName);
  
  const passwordInput = await page.$('input[formcontrolname^="password"]');
  await passwordInput.type(password);



  await page.waitForSelector('input#captcha');
  await page.type('input#captcha', captchaText.replace(/\s/g, ""));


 // Wait for the button to be visible
 await page.waitForSelector('button[type="submit"]');

 // Click on the button by its text
 await page.evaluate(() => {
   const buttons = Array.from(document.querySelectorAll('button[type="submit"]'));
   const targetButton = buttons.find(button => button.textContent.includes('SIGN IN'));
   if (targetButton) {
     targetButton.click();
   }
 })

//   await browser.close();
}

// Run the scraping function
main();
