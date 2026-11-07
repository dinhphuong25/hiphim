const fs = require("fs");
const path = require("path");

function patchFile(filePath, replacer) {
  const fullPath = path.resolve(__dirname, "..", filePath);
  if (!fs.existsSync(fullPath)) {
    return false;
  }
  const original = fs.readFileSync(fullPath, "utf-8");
  const updated = replacer(original);
  if (original !== updated) {
    fs.writeFileSync(fullPath, updated, "utf-8");
    console.log(`[patch-opennext] Successfully patched: ${filePath}`);
    return true;
  }
  return false;
}

// 1. Patch bundle-server.js to mark cloudflare:sockets as external
patchFile("node_modules/@opennextjs/cloudflare/dist/cli/build/bundle-server.js", (content) => {
  if (content.includes('"cloudflare:sockets"')) {
    return content;
  }
  return content.replace(
    'external: ["./middleware/handler.mjs"]',
    'external: ["./middleware/handler.mjs", "cloudflare:sockets"]'
  );
});

// 2. Patch createServerBundle.js if needed
patchFile("node_modules/@opennextjs/cloudflare/dist/cli/build/open-next/createServerBundle.js", (content) => {
  if (content.includes('"cloudflare:sockets"')) {
    return content;
  }
  return content.replace(
    'external: ["./middleware.mjs"]',
    'external: ["./middleware.mjs", "cloudflare:sockets"]'
  );
});

// 3. Patch wrangler-external plugin to treat cloudflare:* as external
patchFile("node_modules/@opennextjs/cloudflare/dist/cli/build/patches/plugins/wrangler-external.js", (content) => {
  if (content.includes('filter: /^cloudflare:/')) {
    return content;
  }
  return content.replace(
    'build.onResolve({ filter: /(\\.bin|\\.wasm(\\?module)?)$/ },',
    'build.onResolve({ filter: /^cloudflare:/ }, (args) => ({ path: args.path, external: true }));\n            build.onResolve({ filter: /(\\.bin|\\.wasm(\\?module)?)$/ },'
  );
});

console.log("[patch-opennext] Patch execution completed.");
