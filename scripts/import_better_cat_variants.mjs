import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const packRoot = process.argv[2] ?? "C:\\Users\\user\\Downloads\\Better Cats v4.0 1.21.10";
const sourceTextureDir = path.join(packRoot, "assets", "minecraft", "textures", "entity", "cat");
const outputRoot = path.join(repoRoot, "public", "textures", "cats", "better-cats");
const outputCoatDir = path.join(outputRoot, "coats");
const outputOverlayDir = path.join(outputRoot, "overlays");

const CURATED_VARIANT_IDS = [
  "tabby",
  "red",
  "calico",
  "siamese",
  "british_shorthair",
  "ragdoll",
  "black",
  "white"
];

const SHARED_OVERLAY_FILES = ["cat_eyes", "cat_eyes_e", "whiskers"];

async function ensureSourceExists(filePath) {
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`Missing Better Cats source asset: ${filePath}`);
  }
}

async function copyTexture(sourceFilePath, targetFilePath) {
  await ensureSourceExists(sourceFilePath);
  await fs.mkdir(path.dirname(targetFilePath), { recursive: true });
  await fs.copyFile(sourceFilePath, targetFilePath);
}

async function main() {
  console.log(`Importing curated Better Cats assets from ${packRoot}`);
  console.log("Better Cats v4.0 1.21.10 curated launch set:", CURATED_VARIANT_IDS.join(", "));

  for (const variantId of CURATED_VARIANT_IDS) {
    const sourceFilePath = path.join(sourceTextureDir, `${variantId}.png`);
    const targetFilePath = path.join(outputCoatDir, `${variantId}.png`);
    await copyTexture(sourceFilePath, targetFilePath);
  }

  for (const overlayName of SHARED_OVERLAY_FILES) {
    const sourceFilePath = path.join(sourceTextureDir, `${overlayName}.png`);
    const targetFilePath = path.join(outputOverlayDir, `${overlayName}.png`);
    await copyTexture(sourceFilePath, targetFilePath);
  }

  console.log(`Imported ${CURATED_VARIANT_IDS.length} coat textures into ${outputCoatDir}`);
  console.log(`Imported ${SHARED_OVERLAY_FILES.length} shared overlays into ${outputOverlayDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
