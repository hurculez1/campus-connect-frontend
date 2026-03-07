const Jimp = require('jimp');
const path = require('path');

const logoPath = path.join(__dirname, 'public', 'logo.png');
const outPath = path.join(__dirname, 'public', 'logo.png');

async function removeBackground() {
  try {
    const image = await Jimp.read(logoPath);
    
    // We assume the top-left pixel is the background color
    const bgColor = Jimp.intToRGBA(image.getPixelColor(0, 0));
    console.log('Detected background color:', bgColor);
    
    // Tolerance for color matching
    const tolerance = 15; 
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      // Get R, G, B channels
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // Calculate color distance
      const distance = Math.sqrt(
        Math.pow(r - bgColor.r, 2) + 
        Math.pow(g - bgColor.g, 2) + 
        Math.pow(b - bgColor.b, 2)
      );
      
      // If it's close to the background color, make it fully transparent
      if (distance < tolerance) {
        this.bitmap.data[idx + 3] = 0; // Alpha channel to 0
      }
    });

    await image.writeAsync(outPath);
    console.log('Successfully removed background and saved to', outPath);
  } catch (err) {
    console.error('Error removing background:', err);
  }
}

removeBackground();
