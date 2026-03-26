const MAX_MEMORY_FRAME_DIMENSION = 1024;
const MEMORY_FRAME_IMAGE_QUALITY = 0.86;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("We couldn't read that image."));
    };
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("We couldn't read that image."));
        return;
      }

      resolve(reader.result);
    };

    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onerror = () => {
      reject(new Error("We couldn't prepare that image."));
    };
    image.onload = () => resolve(image);
    image.src = dataUrl;
  });
}

export async function prepareMemoryFrameImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file for the memory frame.");
  }

  const sourceDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(sourceDataUrl);
  const longestEdge = Math.max(image.width, image.height, 1);
  const scale = Math.min(1, MAX_MEMORY_FRAME_DIMENSION / longestEdge);
  const canvas = document.createElement("canvas");

  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    return sourceDataUrl;
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", MEMORY_FRAME_IMAGE_QUALITY);
}
