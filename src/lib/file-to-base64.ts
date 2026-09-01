export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();

  let binary = "";

  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}
