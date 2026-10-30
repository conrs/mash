/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {}],
  },
  // marked is ESM-only; Jest on Node 22 can't require() it, so use its UMD build.
  moduleNameMapper: {
    "^marked$": "<rootDir>/node_modules/marked/lib/marked.umd.js",
  },
};
