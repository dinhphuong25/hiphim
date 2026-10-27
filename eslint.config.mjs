import nextConfig from "eslint-config-next";

// Relax React 19 experimental compiler rules & unescaped entities to prevent unnecessary lint breakages
if (nextConfig[0]?.rules) {
  nextConfig[0].rules["react-hooks/refs"] = "warn";
  nextConfig[0].rules["react-hooks/set-state-in-effect"] = "warn";
  nextConfig[0].rules["react-hooks/use-memo"] = "warn";
  nextConfig[0].rules["react-hooks/purity"] = "warn";
  nextConfig[0].rules["react-hooks/preserve-manual-memoization"] = "warn";
  nextConfig[0].rules["react-hooks/immutability"] = "warn";
  nextConfig[0].rules["react/no-unescaped-entities"] = "off";
}

export default [
  ...nextConfig,
  {
    ignores: [
      ".next/**",
      ".open-next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "public/**",
      "next-env.d.ts",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
    ],
  },
];
