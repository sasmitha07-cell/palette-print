export async function fileToBase64(file: File, maxDim = 512): Promise<string> {
  // If in browser and image, resize to thumbnail for ultra-fast network transmission
  if (
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    file.type.startsWith("image/")
  ) {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        const parts = dataUrl.split(",");
        if (parts[1]) return parts[1];
      }
    } catch {
      // Fallback to FileReader below
    }
  }

  // Fast native browser FileReader fallback (avoids string concatenation loop)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
