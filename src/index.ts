import { Composio } from "@composio/core";
import { mkdir, writeFile } from "fs/promises";

const composio = new Composio();

const toolkits = (process.env.TOOLKITS ?? "googlesuper,github")
  .split(",")
  .map((toolkit) => toolkit.trim())
  .filter(Boolean);

if (!process.env.COMPOSIO_API_KEY) {
  throw new Error(
    "COMPOSIO_API_KEY is missing. Run `COMPOSIO_API_KEY=... sh scaffold.sh` first.",
  );
}

await mkdir("data", { recursive: true });

const byToolkit: Record<string, unknown> = {};

for (const toolkit of toolkits) {
  console.log(`Fetching raw Composio tools for ${toolkit}...`);
  // Raw tools are direct tools from Composio without provider wrapping.
  // Provider wrapping is needed for execution, but the raw schemas are better
  // source material for dependency discovery.
  const tools = await composio.tools.getRawComposioTools({
    toolkits: [toolkit],
    limit: 1000,
  });

  byToolkit[toolkit] = tools;
  await writeFile(
    `data/${toolkit}_tools.json`,
    JSON.stringify(tools, null, 2),
    "utf-8",
  );
  console.log(`Wrote data/${toolkit}_tools.json`);
}

await writeFile(
  "data/raw-tools.json",
  JSON.stringify(byToolkit, null, 2),
  "utf-8"
);
console.log("Wrote data/raw-tools.json");
