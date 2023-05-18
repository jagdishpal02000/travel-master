const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

// const crypto = require('crypto');


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
    // const hash = crypto.createHash('md5').update(modifiedBuffer).digest('hex');
  
    // Write the modified image to the output path
    const filePath = path.join(__dirname, '..', 'temp', 'captcha.png');
    fs.writeFileSync(filePath, modifiedBuffer);
  
    return 'temp/captcha.png';
  }

  module.exports = {modifyAndSaveImage};