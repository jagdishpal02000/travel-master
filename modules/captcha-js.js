const tesseract = require('tesseract.js');


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

  module.exports = {recognizeCaptcha};