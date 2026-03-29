import fs from "node:fs";
import path from "node:path";

async function readRequestJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function writeJson(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}

let dbWritePromise = Promise.resolve();

export function inAppEditorPlugin() {
  return {
    name: "inAppEditorPlugin",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const method = request.method ?? "GET";
        const requestUrl = request.url ? new URL(request.url, "http://localhost") : null;

        if (!requestUrl || !requestUrl.pathname.startsWith("/__editor/save-furniture")) {
          next();
          return;
        }

        if (method === "POST") {
          try {
            const requestBody = await readRequestJson(request);
            
            // We enqueue writes to prevent race conditions during heavy editing
            const targetPath = path.resolve(server.config.root, "src/lib/furnitureRegistry.ts");
            const nextWrite = dbWritePromise.then(() => {
              const fileContent = fs.readFileSync(targetPath, "utf8");
              
              // We use Regex to cleanly swap out ONLY the data object block, 
              // preserving all types above it and functions below it.
              // Note: This relies on the specific formatting pattern of the file.
              const regex = /(export const FURNITURE_REGISTRY: Record<FurnitureType, FurnitureDefinition> =\s*)([\s\S]*?)(;\s*const FURNITURE_COLLISION_BOXES)/;
              
              if (!regex.test(fileContent)) {
                 throw new Error("Could not find the FURNITURE_REGISTRY object block in the file.");
              }
              
              const newObjectString = JSON.stringify(requestBody, null, 2);
              const newCode = fileContent.replace(regex, `$1${newObjectString}$3`);
              
              fs.writeFileSync(targetPath, newCode, "utf8");
            });
            
            dbWritePromise = nextWrite.catch(err => console.error("Write error:", err));
            await dbWritePromise;
            
            writeJson(response, 200, { success: true });
          } catch (error) {
            console.error("Failed to save furniture registry:", error);
            writeJson(response, 500, { success: false, error: error.message });
          }
          return;
        }

        next();
      });
    }
  };
}
