import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "proj_ojnquoglqxnkjnbyvkqg",
  runtime: "node",
  logLevel: "log",
  dirs: ["./src/trigger"],
  maxDuration: 300,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
});
