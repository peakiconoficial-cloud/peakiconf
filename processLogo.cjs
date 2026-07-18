const Jimp = require('jimp');

async function processImage() {
  const image = await Jimp.read('./public/logo.jpg');
  
  // Make black pixels transparent
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    
    // Threshold for near-black pixels
    if (r < 40 && g < 40 && b < 40) {
      this.bitmap.data[idx + 3] = 0; // Alpha to 0 (fully transparent)
    }
  });

  // Autocrop to remove transparent borders
  image.autocrop();
  
  await image.writeAsync('./public/logo.png');
  console.log('Done! logo.png created with transparent background.');
}

processImage().catch(console.error);
