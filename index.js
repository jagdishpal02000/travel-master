const puppeteer = require('puppeteer');
const fs = require('fs');
const crypto = require('crypto');
const tesseract = require('tesseract.js');
const Jimp = require('jimp');
require('dotenv').config();

const userName = process.env.IRCTC_USERNAME;
const password = process.env.IRCTC_PASSWORD;

// Function to modify the image and save it
async function modifyAndSaveImage(imageData) {
  const buffer = Buffer.from(imageData, 'base64');

  // Load the image using Jimp
  const image = await Jimp.read(buffer);

  // Iterate over each pixel and modify the background and text color
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    // Check if the pixel represents text (white color)
    const isTextPixel = this.bitmap.data[idx] === 255 && // R
      this.bitmap.data[idx + 1] === 255 && // G
      this.bitmap.data[idx + 2] === 255; // B

    // Set the background color to black
    this.bitmap.data[idx] = 0; // R
    this.bitmap.data[idx + 1] = 0; // G
    this.bitmap.data[idx + 2] = 0; // B

    // Set the alpha channel to 255 (opaque)
    this.bitmap.data[idx + 3] = 255;

    // Invert the color of the text pixels (white to black)
    if (isTextPixel) {
      this.bitmap.data[idx] = 255; // R
      this.bitmap.data[idx + 1] = 255; // G
      this.bitmap.data[idx + 2] = 255; // B
    }
  });

  // Get the modified image as a buffer
  const modifiedBuffer = await image.getBufferAsync(Jimp.MIME_PNG);

  // Create the hash from the modified image buffer
  const hash = crypto.createHash('md5').update(modifiedBuffer).digest('hex');

  // Write the modified image to the output path
  fs.writeFileSync('temp/captcha.png', modifiedBuffer);

  return 'temp/captcha.png';
}

// Function to recognize the captcha using Tesseract.js
async function recognizeCaptcha(imagePath) {
  try {
    const result = await tesseract.recognize(imagePath, 'eng', { logger: e => true });
    return result.data.text;
  } catch (error) {
    console.error('Error recognizing captcha:', error);
    throw error;
  }
}

// Main function to execute the scraping
async function runScraping() {
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
runScraping();
