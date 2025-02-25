(() => {
    console.log("Canvas fingerprinting blocker active.");
    console.log("Canvas blocker script loaded!");

  
    // Save original references
    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
  
    // A simple "scramble" function to slightly modify the raw pixel data
    function scrambleImageData(imageData) {
      // For demonstration, we’ll flip the lowest bits of each pixel.
      // Real blockers often do something more sophisticated or random.
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i]   = imageData.data[i]   ^ 7; // R
        imageData.data[i+1] = imageData.data[i+1] ^ 7; // G
        imageData.data[i+2] = imageData.data[i+2] ^ 7; // B
        // alpha (i+3) left alone
      }
      return imageData;
    }
  
    // 1) Override getImageData
    CanvasRenderingContext2D.prototype.getImageData = function(x, y, w, h) {
      let imageData = originalGetImageData.apply(this, arguments);
      // Scramble or randomize
      return scrambleImageData(imageData);
    };
  
    // 2) Override toDataURL
    HTMLCanvasElement.prototype.toDataURL = function() {
      console.log("Canvas toDataURL called!");
      // Temporarily scramble the canvas before letting toDataURL read it
      scramble2DContext(this);
      // Return the original toDataURL result
      let result = originalToDataURL.apply(this, args);
      console.log("Scrambled data URL:", result.slice(0, 50), "..."); // partial preview
      return result;
    };
  
    // 3) Override toBlob
    HTMLCanvasElement.prototype.toBlob = function() {
      scramble2DContext(this);
      return originalToBlob.apply(this, arguments);
    };
  
    // Helper: scramble the 2D context of a given canvas
    function scramble2DContext(canvas) {

      // If a site is using a 2D context, scramble its pixel data
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
  
      let width = canvas.width, height = canvas.height;
      let imageData = ctx.getImageData(0, 0, width, height);
      scrambleImageData(imageData);
      ctx.putImageData(imageData, 0, 0);
    }
  })();
  