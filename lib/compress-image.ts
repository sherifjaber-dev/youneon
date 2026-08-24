const MAX_EDGE_PX = 512;
const JPEG_QUALITY = 0.7;

export function compressImageFile(
  file: File,
  maxPx = MAX_EDGE_PX,
  quality = JPEG_QUALITY
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.onload = () => {
      const src = typeof reader.result === "string" ? reader.result : "";
      if (!src) {
        reject(new Error("Could not read image"));
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load image"));
      img.onload = () => {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (!w || !h) {
          reject(new Error("Invalid image"));
          return;
        }
        const scale = Math.min(1, maxPx / Math.max(w, h));
        const width = Math.max(1, Math.round(w * scale));
        const height = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not process image"));
          return;
        }
        ctx.fillStyle = "#1a0a24";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch {
          reject(new Error("Could not compress image"));
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}
