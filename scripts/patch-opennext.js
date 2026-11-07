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

// 4. Polyfill Uint8Array.prototype.toBase64 for worker-mailer
const polyfillCode = `if(typeof Uint8Array.prototype.toBase64!=="function"){Object.defineProperty(Uint8Array.prototype,"toBase64",{value:function(){var b="";for(var i=0;i<this.byteLength;i++){b+=String.fromCharCode(this[i]);}return btoa(b);},writable:true,configurable:true});}\n`;

patchFile("node_modules/worker-mailer/dist/index.mjs", (content) => {
  if (content.includes("Uint8Array.prototype.toBase64")) {
    return content;
  }
  return polyfillCode + content;
});

patchFile("node_modules/worker-mailer/dist/index.js", (content) => {
  if (content.includes("Uint8Array.prototype.toBase64")) {
    return content;
  }
  return polyfillCode + content;
});

console.log("[patch-opennext] Patch execution completed.");
