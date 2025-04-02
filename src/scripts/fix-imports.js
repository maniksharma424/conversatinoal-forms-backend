import fs from "fs";
import path from "path";
import { glob } from "glob";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "src");

async function findTsFiles() {
  const files = await glob("src/**/*.ts", {
    cwd: rootDir,
    ignore: ["**/node_modules/**", "**/dist/**"],
  });
  return files;
}

function calculateRelativePath(fromFile, toImport) {
  // Remove path alias and get the real path
  const importPath = toImport.replace(/^(@\/|src\/|#\/)/, "");

  // Get directory of source file
  const fromDir = path.dirname(fromFile);

  // Target is in src/[importPath]
  const toDir = path.join(sourceDir, importPath);

  // Calculate relative path
  let relativePath = path.relative(fromDir, toDir);

  // Ensure it starts with ./ or ../
  if (!relativePath.startsWith(".")) {
    relativePath = "./" + relativePath;
  }

  // Replace backslashes with forward slashes for consistent paths
  return relativePath.replace(/\\/g, "/");
}

async function processFile(file) {
  try {
    const filePath = path.join(rootDir, file);
    let content = fs.readFileSync(filePath, "utf8");
    let modified = false;

    // Regular expression to match imports and exports
    const importRegex =
      /import\s+(?:{[^}]*}|\*\s+as\s+[^\s;]+|[^\s;,]+(?:\s*,\s*{[^}]*})?)\s+from\s+['"]([^'"]+)['"]/g;
    const exportRegex =
      /export\s+(?:{[^}]*}|\*\s+as\s+[^\s;]+|[^\s;,]+(?:\s*,\s*{[^}]*})?)\s+from\s+['"]([^'"]+)['"]/g;

    // Process imports
    content = content.replace(importRegex, (match, importPath) => {
      // Skip external modules
      if (
        !importPath.startsWith("@/") &&
        !importPath.startsWith("src/") &&
        !importPath.startsWith("#/") &&
        !importPath.startsWith(".")
      ) {
        return match;
      }

      // Calculate relative path
      let newPath = importPath;
      if (
        importPath.startsWith("@/") ||
        importPath.startsWith("src/") ||
        importPath.startsWith("#/")
      ) {
        newPath = calculateRelativePath(filePath, importPath);
      }

      // Add .js extension if it doesn't have one and isn't a directory import
      if (!newPath.endsWith(".js") && !newPath.endsWith("/")) {
        newPath += ".js";
      }

      modified = true;
      return match.replace(importPath, newPath);
    });

    // Process exports
    content = content.replace(exportRegex, (match, importPath) => {
      // Skip external modules
      if (
        !importPath.startsWith("@/") &&
        !importPath.startsWith("src/") &&
        !importPath.startsWith("#/") &&
        !importPath.startsWith(".")
      ) {
        return match;
      }

      // Calculate relative path
      let newPath = importPath;
      if (
        importPath.startsWith("@/") ||
        importPath.startsWith("src/") ||
        importPath.startsWith("#/")
      ) {
        newPath = calculateRelativePath(filePath, importPath);
      }

      // Add .js extension if it doesn't have one and isn't a directory import
      if (!newPath.endsWith(".js") && !newPath.endsWith("/")) {
        newPath += ".js";
      }

      modified = true;
      return match.replace(importPath, newPath);
    });

    if (modified) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`Updated imports in ${file}`);
    }
  } catch (error) {
    console.error(`Error processing file ${file}:`, error);
  }
}

async function main() {
  try {
    const files = await findTsFiles();
    console.log(`Found ${files.length} TypeScript files to process`);

    for (const file of files) {
      await processFile(file);
    }

    console.log("Import conversion complete!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
