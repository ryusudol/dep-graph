import { mkdir, readFile, writeFile } from "node:fs/promises";

type JsonObject = Record<string, unknown>;

type Toolkit = "googlesuper" | "github" | "unknown";

type RawTool = JsonObject & {
  __sourceToolkit?: string;
};

type ParamInfo = {
  name: string;
  path: string;
  description: string;
  required: boolean;
};

type ResourceId =
  | "email_address"
  | "gmail_thread_id"
  | "gmail_message_id"
  | "gmail_draft_id"
  | "gmail_label_id"
  | "gmail_attachment_id"
  | "google_file_id"
  | "google_folder_id"
  | "google_document_id"
  | "google_spreadsheet_id"
  | "google_sheet_id"
  | "google_sheet_range"
  | "google_calendar_id"
  | "google_event_id"
  | "google_task_list_id"
  | "google_task_id"
  | "google_contact_id"
  | "google_meet_id"
  | "github_owner"
  | "github_repo"
  | "github_issue_number"
  | "github_pull_number"
  | "github_branch"
  | "github_ref"
  | "github_commit_sha"
  | "github_file_path"
  | "github_workflow_id"
  | "github_run_id"
  | "github_job_id"
  | "github_release_id"
  | "github_tag"
  | "github_gist_id"
  | "github_team_slug"
  | "github_project_id";

type ResourceDefinition = {
  id: ResourceId;
  label: string;
  toolkit: Toolkit | "any";
  askUser: boolean;
  input: RegExp[];
  output: RegExp[];
  producer: RegExp[];
};

type ResourceMatch = {
  resource: ResourceId;
  label: string;
  evidence: string[];
  score: number;
  required?: boolean;
};

type ToolNode = {
  id: string;
  toolkit: Toolkit;
  displayName: string;
  description: string;
  inputs: ParamInfo[];
  consumes: ResourceMatch[];
  produces: ResourceMatch[];
};

type GraphEdge = {
  source: string;
  target: string;
  resource: ResourceId;
  label: string;
  evidence: string;
  confidence: number;
  kind: "tool_dependency" | "ask_user";
};

const RAW_TOOLS_PATH = process.env.RAW_TOOLS_PATH ?? "data/raw-tools.json";
const OUT_DIR = process.env.GRAPH_OUT_DIR ?? "graph";
const D3_BUNDLE_PATH = "node_modules/d3/dist/d3.min.js";
const MAX_PRODUCERS_PER_RESOURCE = Number(
  process.env.MAX_PRODUCERS_PER_RESOURCE ?? 6,
);

const RESOURCES: ResourceDefinition[] = [
  resource("email_address", "Email address", "any", true, [
    /(^|_)(to|cc|bcc|from|sender|recipient|email|email_address|user_email|owner_email)(_|$)/i,
    /email address/i,
  ], [
    /email/i,
  ], [
    /CONTACT|PEOPLE|PROFILE|USER/i,
  ]),
  resource("gmail_thread_id", "Gmail thread id", "googlesuper", false, [
    /(^|_)(thread|thread_id|gmail_thread_id)(_|$)/i,
    /thread id/i,
  ], [
    /thread.*id|id.*thread/i,
  ], [
    /THREAD|FETCH_EMAILS|FETCH_MESSAGE/i,
  ]),
  resource("gmail_message_id", "Gmail message id", "googlesuper", false, [
    /(^|_)(message|message_id|gmail_message_id|mail_id|email_id)(_|$)/i,
    /message id|email id/i,
  ], [
    /message.*id|id.*message/i,
  ], [
    /MESSAGE|EMAIL|DRAFT|THREAD/i,
  ]),
  resource("gmail_draft_id", "Gmail draft id", "googlesuper", false, [
    /(^|_)(draft|draft_id)(_|$)/i,
    /draft id/i,
  ], [
    /draft.*id|id.*draft/i,
  ], [
    /DRAFT/i,
  ]),
  resource("gmail_label_id", "Gmail label id", "googlesuper", false, [
    /(^|_)(label|label_id|gmail_label_id)(_|$)/i,
    /label id/i,
  ], [
    /label.*id|id.*label/i,
  ], [
    /LABEL/i,
  ]),
  resource("gmail_attachment_id", "Gmail attachment id", "googlesuper", false, [
    /(^|_)(attachment|attachment_id)(_|$)/i,
    /attachment id/i,
  ], [
    /attachment.*id|id.*attachment/i,
  ], [
    /ATTACHMENT|FETCH_MESSAGE/i,
  ]),
  resource("google_file_id", "Google Drive file id", "googlesuper", false, [
    /(^|_)(file|file_id|drive_file_id)(_|$)/i,
    /file id/i,
  ], [
    /file.*id|id.*file/i,
  ], [
    /FILE|DOCUMENT|SHEET|PRESENTATION|UPLOAD|COPY/i,
  ]),
  resource("google_folder_id", "Google Drive folder id", "googlesuper", false, [
    /(^|_)(folder|folder_id|parent|parent_id|drive_id)(_|$)/i,
    /folder id|parent folder/i,
  ], [
    /folder.*id|id.*folder|parent.*id/i,
  ], [
    /FOLDER|DRIVE|PARENT|CHILDREN/i,
  ]),
  resource("google_document_id", "Google document id", "googlesuper", false, [
    /(^|_)(document|document_id|doc_id)(_|$)/i,
    /document id|doc id/i,
  ], [
    /document.*id|id.*document/i,
  ], [
    /DOCUMENT|DOC/i,
  ]),
  resource("google_spreadsheet_id", "Google spreadsheet id", "googlesuper", false, [
    /(^|_)(spreadsheet|spreadsheet_id|sheet_file_id)(_|$)/i,
    /spreadsheet id/i,
  ], [
    /spreadsheet.*id|id.*spreadsheet/i,
  ], [
    /SPREADSHEET|GOOGLE_SHEET|SHEET/i,
  ]),
  resource("google_sheet_id", "Google sheet id/name", "googlesuper", false, [
    /(^|_)(sheet|sheet_id|sheet_name|worksheet|worksheet_id|worksheet_title)(_|$)/i,
    /sheet id|sheet name|worksheet/i,
  ], [
    /sheet.*id|sheet.*name|worksheet/i,
  ], [
    /SHEET_NAMES|SPREADSHEET_INFO|WORKSHEET|ADD_SHEET/i,
  ]),
  resource("google_sheet_range", "Google sheet range", "googlesuper", true, [
    /(^|_)(range|ranges|a1_range|cell_range)(_|$)/i,
    /A1 range|cell range|range/i,
  ], [
    /range/i,
  ], [
    /SPREADSHEET|SHEET|VALUES/i,
  ]),
  resource("google_calendar_id", "Google calendar id", "googlesuper", false, [
    /(^|_)(calendar|calendar_id)(_|$)/i,
    /calendar id/i,
  ], [
    /calendar.*id|id.*calendar/i,
  ], [
    /CALENDAR/i,
  ]),
  resource("google_event_id", "Google calendar event id", "googlesuper", false, [
    /(^|_)(event|event_id)(_|$)/i,
    /event id/i,
  ], [
    /event.*id|id.*event/i,
  ], [
    /EVENT/i,
  ]),
  resource("google_task_list_id", "Google task list id", "googlesuper", false, [
    /(^|_)(tasklist|task_list|task_list_id|tasklist_id)(_|$)/i,
    /task list id/i,
  ], [
    /task.*list.*id|id.*task.*list/i,
  ], [
    /TASK_LIST|TASKS_LIST/i,
  ]),
  resource("google_task_id", "Google task id", "googlesuper", false, [
    /(^|_)(task|task_id)(_|$)/i,
    /task id/i,
  ], [
    /task.*id|id.*task/i,
  ], [
    /TASK/i,
  ]),
  resource("google_contact_id", "Google contact/person id", "googlesuper", false, [
    /(^|_)(contact|contact_id|person|person_id|resource_name)(_|$)/i,
    /contact id|person id|resource name/i,
  ], [
    /contact.*id|person.*id|resource.*name/i,
  ], [
    /CONTACT|PEOPLE/i,
  ]),
  resource("google_meet_id", "Google Meet/conference id", "googlesuper", false, [
    /(^|_)(meet|meet_id|conference|conference_id|conference_record)(_|$)/i,
    /meet id|conference/i,
  ], [
    /meet.*id|conference/i,
  ], [
    /MEET|CONFERENCE|RECORDING|TRANSCRIPT/i,
  ]),
  resource("github_owner", "GitHub owner/org", "github", true, [
    /(^|_)(owner|org|organization|username|account)(_|$)/i,
    /repository owner|organization|username/i,
  ], [
    /owner|login|organization|username/i,
  ], [
    /(^|_)(GET|LIST|SEARCH)_(USER|USERS|ORG|ORGS|ORGANIZATION|ORGANIZATIONS)(_|$)/i,
    /(^|_)(GET|LIST|SEARCH)_(REPO|REPOS|REPOSITORY|REPOSITORIES)(_|$)/i,
  ]),
  resource("github_repo", "GitHub repository", "github", true, [
    /(^|_)(repo|repository|repo_name|repository_name)(_|$)/i,
    /repository name|repo name/i,
  ], [
    /repo|repository|full_name/i,
  ], [
    /(^|_)(GET|LIST|SEARCH|CREATE|FORK)_(REPO|REPOS|REPOSITORY|REPOSITORIES)(_|$)/i,
  ]),
  resource("github_issue_number", "GitHub issue number", "github", false, [
    /(^|_)(issue|issue_number|number)(_|$)/i,
    /issue number/i,
  ], [
    /issue.*number|number/i,
  ], [
    /(^|_)(GET|LIST|SEARCH|CREATE)_(ISSUE|ISSUES)(_|$)/i,
  ]),
  resource("github_pull_number", "GitHub pull request number", "github", false, [
    /(^|_)(pull|pull_number|pull_request|pr|pr_number)(_|$)/i,
    /pull request number|PR number/i,
  ], [
    /pull.*number|pr.*number/i,
  ], [
    /(^|_)(GET|LIST|SEARCH|CREATE)_(PULL|PULLS|PULL_REQUEST|PULL_REQUESTS|PR|PRS)(_|$)/i,
  ]),
  resource("github_branch", "GitHub branch", "github", true, [
    /(^|_)(branch|branch_name|base|head|base_ref|head_ref)(_|$)/i,
    /branch name|base branch|head branch/i,
  ], [
    /branch|ref/i,
  ], [
    /(^|_)(GET|LIST|CREATE)_(BRANCH|BRANCHES)(_|$)/i,
  ]),
  resource("github_ref", "GitHub ref", "github", false, [
    /(^|_)(ref|git_ref|reference)(_|$)/i,
    /git ref|reference/i,
  ], [
    /ref|reference/i,
  ], [
    /(^|_)(GET|LIST|CREATE)_(REF|REFS|REFERENCE|REFERENCES|BRANCH|BRANCHES|TAG|TAGS)(_|$)/i,
  ]),
  resource("github_commit_sha", "GitHub commit SHA", "github", false, [
    /(^|_)(sha|commit_sha|commit|head_sha|base_sha)(_|$)/i,
    /commit sha|SHA/i,
  ], [
    /sha|commit/i,
  ], [
    /(^|_)(GET|LIST|SEARCH|CREATE)_(COMMIT|COMMITS|REF|REFS|BRANCH|BRANCHES|COMPARE)(_|$)/i,
  ]),
  resource("github_file_path", "GitHub file path", "github", true, [
    /(^|_)(path|file_path|filepath|filename)(_|$)/i,
    /file path|path in repository/i,
  ], [
    /path|filename/i,
  ], [
    /(^|_)(GET|LIST|CREATE|UPDATE)_(CONTENT|CONTENTS|FILE|FILES|TREE|BLOB|BLOBS)(_|$)/i,
  ]),
  resource("github_workflow_id", "GitHub workflow id", "github", false, [
    /(^|_)(workflow|workflow_id)(_|$)/i,
    /workflow id/i,
  ], [
    /workflow.*id|id.*workflow/i,
  ], [
    /WORKFLOW/i,
  ]),
  resource("github_run_id", "GitHub workflow run id", "github", false, [
    /(^|_)(run|run_id|workflow_run_id)(_|$)/i,
    /run id|workflow run/i,
  ], [
    /run.*id|workflow.*run/i,
  ], [
    /RUN|WORKFLOW/i,
  ]),
  resource("github_job_id", "GitHub Actions job id", "github", false, [
    /(^|_)(job|job_id)(_|$)/i,
    /job id/i,
  ], [
    /job.*id/i,
  ], [
    /JOB/i,
  ]),
  resource("github_release_id", "GitHub release id", "github", false, [
    /(^|_)(release|release_id)(_|$)/i,
    /release id/i,
  ], [
    /release.*id/i,
  ], [
    /RELEASE/i,
  ]),
  resource("github_tag", "GitHub tag", "github", true, [
    /(^|_)(tag|tag_name|version)(_|$)/i,
    /tag name/i,
  ], [
    /tag/i,
  ], [
    /TAG|RELEASE|REF/i,
  ]),
  resource("github_gist_id", "GitHub gist id", "github", false, [
    /(^|_)(gist|gist_id)(_|$)/i,
    /gist id/i,
  ], [
    /gist.*id/i,
  ], [
    /GIST/i,
  ]),
  resource("github_team_slug", "GitHub team slug", "github", false, [
    /(^|_)(team|team_slug|slug)(_|$)/i,
    /team slug/i,
  ], [
    /team.*slug|slug/i,
  ], [
    /TEAM/i,
  ]),
  resource("github_project_id", "GitHub project id", "github", false, [
    /(^|_)(project|project_id|project_number)(_|$)/i,
    /project id|project number/i,
  ], [
    /project.*id|project.*number/i,
  ], [
    /PROJECT/i,
  ]),
];

const raw = JSON.parse(await readFile(RAW_TOOLS_PATH, "utf-8")) as unknown;
const d3Source = await readFile(D3_BUNDLE_PATH, "utf-8");
const tools = flattenTools(raw);
const nodes = tools.map(toNode);
const producersByResource = indexProducers(nodes);
const edges = buildEdges(nodes, producersByResource);

await mkdir(OUT_DIR, { recursive: true });
await writeFile(`${OUT_DIR}/dependency-graph.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: RAW_TOOLS_PATH,
  summary: summarize(nodes, edges),
  resources: RESOURCES.map(({ id, label, toolkit, askUser }) => ({
    id,
    label,
    toolkit,
    askUser,
  })),
  nodes,
  edges,
}, null, 2));
await writeFile(`${OUT_DIR}/dependency-graph.dot`, toDot(nodes, edges));
await writeFile(`${OUT_DIR}/summary.md`, toMarkdownSummary(nodes, edges));
await writeFile(`${OUT_DIR}/dependency-graph.html`, toHtml(nodes, edges, d3Source));

console.log(`Read ${tools.length} tools from ${RAW_TOOLS_PATH}`);
console.log(`Wrote ${nodes.length} nodes and ${edges.length} edges to ${OUT_DIR}/`);

function resource(
  id: ResourceId,
  label: string,
  toolkit: Toolkit | "any",
  askUser: boolean,
  input: RegExp[],
  output: RegExp[],
  producer: RegExp[],
): ResourceDefinition {
  return { id, label, toolkit, askUser, input, output, producer };
}

function flattenTools(value: unknown, sourceToolkit?: string): RawTool[] {
  if (Array.isArray(value)) {
    return value
      .filter(isObject)
      .map((tool) => ({ ...tool, __sourceToolkit: sourceToolkit }));
  }
  if (!isObject(value)) {
    return [];
  }

  const flattened: RawTool[] = [];
  for (const [key, child] of Object.entries(value)) {
    if (Array.isArray(child)) {
      flattened.push(...flattenTools(child, key));
    } else if (isObject(child)) {
      const nested = child as JsonObject;
      for (const collectionKey of ["tools", "items", "data", "results"]) {
        if (Array.isArray(nested[collectionKey])) {
          flattened.push(...flattenTools(nested[collectionKey], key));
        }
      }
    }
  }
  return flattened;
}

function toNode(tool: RawTool): ToolNode {
  const id = firstString(tool, [
    "slug",
    "name",
    "key",
    "toolName",
    "action",
    "id",
  ]) ?? `tool_${Math.random().toString(36).slice(2)}`;
  const displayName = firstString(tool, [
    "displayName",
    "display_name",
    "name",
    "slug",
    "key",
  ]) ?? id;
  const description = firstString(tool, [
    "description",
    "desc",
    "summary",
  ]) ?? "";
  const toolkit = inferToolkit(tool, id);
  const inputSchema = firstObject(tool, [
    "inputSchema",
    "input_schema",
    "inputParameters",
    "input_parameters",
    "parameters",
    "parameterSchema",
    "schema",
  ]);
  const outputSchema = firstObject(tool, [
    "outputSchema",
    "output_schema",
    "outputParameters",
    "output_parameters",
    "responseSchema",
    "returns",
  ]);
  const inputs = inputSchema ? collectParams(inputSchema) : [];
  const outputParams = outputSchema ? collectParams(outputSchema) : [];
  const haystack = `${id} ${displayName} ${description}`.replace(/[^a-zA-Z0-9_ ]/g, " ");

  return {
    id,
    toolkit,
    displayName,
    description,
    inputs,
    consumes: matchConsumes(toolkit, inputs),
    produces: matchProduces(toolkit, haystack, outputParams),
  };
}

function inferToolkit(tool: RawTool, id: string): Toolkit {
  const source = String(tool.__sourceToolkit ?? "").toLowerCase();
  const toolkitName = firstString(tool, ["toolkit", "toolkitSlug", "toolkit_slug"]);
  const text = `${source} ${toolkitName ?? ""} ${id}`.toLowerCase();
  if (text.includes("googlesuper") || text.startsWith("google")) {
    return "googlesuper";
  }
  if (text.includes("github")) {
    return "github";
  }
  if (id.toUpperCase().startsWith("GOOGLESUPER_")) {
    return "googlesuper";
  }
  if (id.toUpperCase().startsWith("GITHUB_")) {
    return "github";
  }
  return "unknown";
}

function collectParams(schema: JsonObject, prefix = "", inheritedRequired = false): ParamInfo[] {
  const requiredNames = new Set(
    Array.isArray(schema.required) ? schema.required.filter((item) => typeof item === "string") : [],
  );
  const properties = isObject(schema.properties) ? schema.properties : undefined;
  if (!properties) {
    return [];
  }

  const params: ParamInfo[] = [];
  for (const [name, property] of Object.entries(properties)) {
    if (!isObject(property)) {
      continue;
    }
    const childSchema = property as JsonObject;
    const path = prefix ? `${prefix}.${name}` : name;
    const required = inheritedRequired || requiredNames.has(name);
    params.push({
      name,
      path,
      description: firstString(childSchema, ["description", "title"]) ?? "",
      required,
    });

    const nestedObject =
      childSchema.type === "object" || isObject(childSchema.properties);
    if (nestedObject) {
      params.push(...collectParams(childSchema, path, required));
    }
    if (isObject(childSchema.items)) {
      params.push(...collectParams(childSchema.items, `${path}[]`, required));
    }
  }
  return params;
}

function matchConsumes(toolkit: Toolkit, inputs: ParamInfo[]): ResourceMatch[] {
  const matches = new Map<ResourceId, ResourceMatch>();
  for (const param of inputs) {
    const paramText = `${param.path} ${param.description}`;
    for (const def of RESOURCES) {
      if (!resourceApplies(def, toolkit)) {
        continue;
      }
      const evidence = matchingEvidence(def.input, paramText);
      if (evidence.length === 0) {
        continue;
      }
      const score = (param.required ? 0.75 : 0.45) + Math.min(0.2, evidence.length * 0.05);
      mergeResource(matches, def, {
        evidence: [`input ${param.path}${param.required ? " (required)" : ""}`],
        score,
        required: param.required,
      });
    }
  }
  return [...matches.values()].sort((a, b) => b.score - a.score);
}

function matchProduces(
  toolkit: Toolkit,
  haystack: string,
  outputParams: ParamInfo[],
): ResourceMatch[] {
  const matches = new Map<ResourceId, ResourceMatch>();
  for (const def of RESOURCES) {
    if (!resourceApplies(def, toolkit)) {
      continue;
    }
    const producerEvidence = matchingEvidence(def.producer, haystack);
    if (producerEvidence.length > 0) {
      mergeResource(matches, def, {
        evidence: [`tool name/description matches ${producerEvidence.join(", ")}`],
        score: 0.55 + Math.min(0.25, producerEvidence.length * 0.08),
      });
    }

    for (const param of outputParams) {
      const outputEvidence = matchingEvidence(def.output, `${param.path} ${param.description}`);
      if (outputEvidence.length > 0) {
        mergeResource(matches, def, {
          evidence: [`output ${param.path}`],
          score: 0.85,
        });
      }
    }
  }
  return [...matches.values()].sort((a, b) => b.score - a.score);
}

function mergeResource(
  matches: Map<ResourceId, ResourceMatch>,
  def: ResourceDefinition,
  patch: Omit<ResourceMatch, "resource" | "label">,
) {
  const current = matches.get(def.id);
  if (!current) {
    matches.set(def.id, {
      resource: def.id,
      label: def.label,
      evidence: patch.evidence,
      score: patch.score,
      required: patch.required,
    });
    return;
  }
  current.evidence.push(...patch.evidence);
  current.score = Math.max(current.score, patch.score);
  current.required = current.required || patch.required;
}

function indexProducers(nodes: ToolNode[]) {
  const index = new Map<ResourceId, ToolNode[]>();
  for (const node of nodes) {
    for (const produced of node.produces) {
      const list = index.get(produced.resource) ?? [];
      list.push(node);
      index.set(produced.resource, list);
    }
  }
  for (const [resourceId, producers] of index.entries()) {
    producers.sort((a, b) =>
      producerScore(b, resourceId) - producerScore(a, resourceId),
    );
  }
  return index;
}

function buildEdges(
  nodes: ToolNode[],
  producersByResource: Map<ResourceId, ToolNode[]>,
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  for (const consumer of nodes) {
    for (const consumed of consumer.consumes) {
      const producers = producersByResource.get(consumed.resource) ?? [];
      const sameToolkitProducers = producers.filter(
        (producer) => producer.id !== consumer.id && producer.toolkit === consumer.toolkit,
      );
      for (const producer of sameToolkitProducers.slice(0, MAX_PRODUCERS_PER_RESOURCE)) {
        const produced = producer.produces.find(
          (item) => item.resource === consumed.resource,
        );
        const key = `${producer.id}->${consumer.id}:${consumed.resource}`;
        if (!produced || seen.has(key)) {
          continue;
        }
        seen.add(key);
        edges.push({
          source: producer.id,
          target: consumer.id,
          resource: consumed.resource,
          label: consumed.label,
          evidence: `${producer.displayName} can provide ${consumed.label}; ${consumer.displayName} needs ${consumed.evidence[0]}`,
          confidence: round(Math.min(0.98, (produced.score + consumed.score) / 2)),
          kind: "tool_dependency",
        });
      }

      const def = RESOURCES.find((item) => item.id === consumed.resource);
      if (def?.askUser) {
        const inputNodeId = `ASK_USER:${consumed.resource}`;
        const key = `${inputNodeId}->${consumer.id}:${consumed.resource}`;
        if (!seen.has(key)) {
          seen.add(key);
          edges.push({
            source: inputNodeId,
            target: consumer.id,
            resource: consumed.resource,
            label: `Ask user for ${consumed.label}`,
            evidence: `${consumer.displayName} can run if the user supplies ${consumed.label}`,
            confidence: round(consumed.required ? 0.88 : 0.62),
            kind: "ask_user",
          });
        }
      }
    }
  }
  return edges.sort((a, b) => b.confidence - a.confidence);
}

function producerScore(node: ToolNode, resourceId: ResourceId): number {
  const produced = node.produces.find((item) => item.resource === resourceId);
  const name = node.id.toUpperCase();
  let score = produced?.score ?? 0;
  if (/LIST|SEARCH|FIND|GET|FETCH/.test(name)) {
    score += 0.25;
  }
  if (/CREATE|INSERT|COPY|UPLOAD/.test(name)) {
    score += 0.15;
  }
  if (/DELETE|REMOVE|UPDATE|PATCH|MODIFY/.test(name)) {
    score -= 0.2;
  }
  return score;
}

function summarize(nodes: ToolNode[], edges: GraphEdge[]) {
  const byToolkit = countBy(nodes, (node) => node.toolkit);
  const edgesByKind = countBy(edges, (edge) => edge.kind);
  const edgesByResource = countBy(edges, (edge) => edge.resource);
  return {
    tools: nodes.length,
    edges: edges.length,
    toolDependencies: edgesByKind.tool_dependency ?? 0,
    askUserEdges: edgesByKind.ask_user ?? 0,
    byToolkit,
    topResources: Object.entries(edgesByResource)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([resource, count]) => ({ resource, count })),
  };
}

function toMarkdownSummary(nodes: ToolNode[], edges: GraphEdge[]): string {
  const summary = summarize(nodes, edges);
  const topToolEdges = edges
    .filter((edge) => edge.kind === "tool_dependency")
    .slice(0, 40)
    .map((edge) => `- \`${edge.source}\` -> \`${edge.target}\` via **${edge.label}** (${edge.confidence})`)
    .join("\n");
  const topAskEdges = edges
    .filter((edge) => edge.kind === "ask_user")
    .slice(0, 25)
    .map((edge) => `- \`${edge.target}\` can ask the user for **${edge.label.replace("Ask user for ", "")}**`)
    .join("\n");

  return `# Dependency Graph Summary

- Tools analyzed: ${summary.tools}
- Edges discovered: ${summary.edges}
- Tool-to-tool dependency edges: ${summary.toolDependencies}
- User-input fallback edges: ${summary.askUserEdges}

## Toolkit Coverage

${Object.entries(summary.byToolkit).map(([toolkit, count]) => `- ${toolkit}: ${count}`).join("\n")}

## Most Connected Resources

${summary.topResources.map(({ resource, count }) => `- ${resource}: ${count} edges`).join("\n")}

## Representative Tool Dependencies

${topToolEdges || "- No tool dependencies found."}

## Representative User Input Fallbacks

${topAskEdges || "- No user input fallbacks found."}
`;
}

function toDot(nodes: ToolNode[], edges: GraphEdge[]): string {
  const lines = [
    "digraph ToolDependencyGraph {",
    '  graph [rankdir=LR, overlap=false, splines=true];',
    '  node [shape=box, style="rounded,filled", fontname="Arial", fontsize=10];',
    '  edge [fontname="Arial", fontsize=9, color="#6b7280"];',
  ];
  for (const resourceDef of RESOURCES.filter((item) => item.askUser)) {
    lines.push(
      `  "${dotEscape(`ASK_USER:${resourceDef.id}`)}" [label="${dotEscape(`Ask user: ${resourceDef.label}`)}", fillcolor="#fff7ed", shape=note];`,
    );
  }
  for (const node of nodes) {
    const fill = node.toolkit === "github" ? "#eef2ff" : node.toolkit === "googlesuper" ? "#ecfdf5" : "#f3f4f6";
    lines.push(
      `  "${dotEscape(node.id)}" [label="${dotEscape(node.displayName)}", fillcolor="${fill}"];`,
    );
  }
  for (const edge of edges) {
    const style = edge.kind === "ask_user" ? "dashed" : "solid";
    lines.push(
      `  "${dotEscape(edge.source)}" -> "${dotEscape(edge.target)}" [label="${dotEscape(edge.label)}", style="${style}"];`,
    );
  }
  lines.push("}");
  return `${lines.join("\n")}\n`;
}

function toHtml(nodes: ToolNode[], edges: GraphEdge[], d3Source: string): string {
  const safeD3Source = d3Source.replace(/<\/script/gi, "<\\/script");
  const userNodes = RESOURCES
    .filter((resourceDef) => resourceDef.askUser)
    .map((resourceDef) => ({
      id: `ASK_USER:${resourceDef.id}`,
      toolkit: "user",
      displayName: `Ask user: ${resourceDef.label}`,
      description: "Value can be supplied directly by the user.",
    }));
  const graph = {
    nodes: [...userNodes, ...nodes.map(({ id, toolkit, displayName, description, inputs, consumes, produces }) => ({
      id,
      toolkit,
      displayName,
      description,
      inputs,
      consumes,
      produces,
    }))],
    edges,
  };
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Tool Dependency Graph</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; background: #f8fafc; color: #111827; }
    header { padding: 18px 24px 14px; border-bottom: 1px solid #d1d5db; background: #ffffff; }
    h1 { margin: 0 0 8px; font-size: 22px; font-weight: 650; letter-spacing: 0; }
    .stats { display: flex; gap: 16px; flex-wrap: wrap; color: #4b5563; font-size: 13px; }
    .shell { display: grid; grid-template-columns: minmax(0, 1fr) 380px; height: calc(100vh - 82px); }
    .stage { position: relative; min-width: 0; }
    svg.graph { display: block; width: 100%; height: 100%; background: #ffffff; cursor: grab; touch-action: none; }
    svg.graph:active { cursor: grabbing; }
    .home-button { position: absolute; top: 12px; left: 12px; z-index: 2; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; color: #111827; box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12); cursor: pointer; }
    .home-button:hover { background: #f8fafc; border-color: #94a3b8; }
    .home-button svg { width: 17px; height: 17px; stroke: currentColor; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .edge-path { fill: none; stroke: rgba(51, 65, 85, 0.28); stroke-width: 1.15; cursor: pointer; }
    .edge-path.ask-user { stroke: rgba(234, 88, 12, 0.34); stroke-dasharray: 7 5; }
    .edge-path.is-connected { stroke: rgba(37, 99, 235, 0.86); stroke-width: 1.9; }
    .edge-path.ask-user.is-connected { stroke: rgba(234, 88, 12, 0.9); }
    .edge-path.is-selected { stroke: #111827; stroke-width: 2.3; }
    .edge-path.is-muted { opacity: 0.08; }
    .node-dot { cursor: pointer; stroke: transparent; stroke-width: 0; }
    .node-dot.is-hovered, .node-dot.is-selected { stroke: #111827; stroke-width: 2.2; }
    aside { border-left: 1px solid #d1d5db; background: #f9fafb; padding: 16px; overflow: auto; }
    label { display: block; font-size: 12px; color: #4b5563; margin-bottom: 6px; }
    input, select { width: 100%; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; background: white; color: #111827; margin-bottom: 12px; }
    .legend { display: flex; gap: 8px; flex-wrap: wrap; margin: 10px 0 16px; }
    .pill { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #374151; }
    .swatch { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
    .details { border: 1px solid #dbe3ee; border-radius: 8px; background: #ffffff; padding: 12px; margin: 2px 0 14px; font-size: 12px; line-height: 1.4; }
    .details h2 { margin: 0 0 6px; font-size: 14px; line-height: 1.25; overflow-wrap: anywhere; }
    .details ul { padding-left: 18px; margin: 8px 0 0; }
    .details li { margin: 3px 0; overflow-wrap: anywhere; }
    .edge { border-top: 1px solid #e5e7eb; padding: 10px 0; font-size: 12px; line-height: 1.35; cursor: pointer; }
    .edge:hover { background: #eef2ff; }
    .edge b { display: block; color: #111827; margin-bottom: 4px; }
    .muted { color: #6b7280; }
    .hint { margin: 0 0 10px; font-size: 12px; color: #6b7280; }
    .tooltip { position: fixed; z-index: 3; pointer-events: none; max-width: 360px; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.16); font-size: 12px; line-height: 1.35; display: none; }
    @media (max-width: 900px) {
      .shell { grid-template-columns: 1fr; height: auto; }
      .stage { height: 68vh; }
      aside { border-left: 0; border-top: 1px solid #d1d5db; }
    }
  </style>
</head>
<body>
  <header>
    <h1>Tool Dependency Graph</h1>
    <div class="stats">
      <span><strong id="nodeCount"></strong> nodes</span>
      <span><strong id="edgeCount"></strong> edges</span>
      <span>Solid lines: tool dependency</span>
      <span>Dashed lines: ask user</span>
    </div>
  </header>
  <main class="shell">
    <section class="stage">
      <button id="resetView" class="home-button" type="button" aria-label="Reset graph view" title="Reset graph view">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 11l9-8 9 8"></path>
          <path d="M5 10v10h14V10"></path>
          <path d="M9 20v-6h6v6"></path>
        </svg>
      </button>
      <svg id="graph" class="graph" role="img" aria-label="Tool dependency graph"></svg>
    </section>
    <aside>
      <label for="query">Filter tools/resources</label>
      <input id="query" type="search" placeholder="thread, repo, issue, spreadsheet...">
      <label for="toolkit">Toolkit</label>
      <select id="toolkit">
        <option value="all">All</option>
        <option value="googlesuper">Google Super</option>
        <option value="github">GitHub</option>
        <option value="user">User input</option>
      </select>
      <label for="kind">Edge type</label>
      <select id="kind">
        <option value="all">All</option>
        <option value="tool_dependency">Tool dependency</option>
        <option value="ask_user">Ask user</option>
      </select>
      <div class="legend">
        <span class="pill"><span class="swatch" style="background:#16a34a"></span>Google Super</span>
        <span class="pill"><span class="swatch" style="background:#4f46e5"></span>GitHub</span>
        <span class="pill"><span class="swatch" style="background:#f97316"></span>User input</span>
      </div>
      <p class="hint">Hover a node to inspect it. Click a node or edge to lock its neighborhood.</p>
      <div id="details" class="details">
        <h2>No selection</h2>
        <div class="muted">Select a node or edge to see dependency details.</div>
      </div>
      <div id="edges"></div>
    </aside>
  </main>
  <div id="tooltip" class="tooltip"></div>
  <script>${safeD3Source}</script>
  <script>
    const GRAPH = ${JSON.stringify(graph)};
    const stage = document.querySelector(".stage");
    const svg = d3.select("#graph");
    const query = document.getElementById("query");
    const toolkit = document.getElementById("toolkit");
    const kind = document.getElementById("kind");
    const resetViewButton = document.getElementById("resetView");
    const edgeList = document.getElementById("edges");
    const details = document.getElementById("details");
    const tooltip = document.getElementById("tooltip");
    const colors = { googlesuper: "#16a34a", github: "#4f46e5", user: "#f97316", unknown: "#64748b" };
    const allNodes = GRAPH.nodes.map((node) => Object.assign({}, node));
    const allEdges = GRAPH.edges.map((edge, index) => Object.assign({ index, sourceId: edge.source, targetId: edge.target }, edge));
    const nodeById = new Map(allNodes.map((node) => [node.id, node]));
    const zoomLayer = svg.append("g").attr("class", "zoom-layer");
    const edgeLayer = zoomLayer.append("g").attr("class", "edges");
    const nodeLayer = zoomLayer.append("g").attr("class", "nodes");
    let edgeSelection = edgeLayer.selectAll("path");
    let nodeSelection = nodeLayer.selectAll("circle");
    let hoveredNode = null;
    let selectedNode = null;
    let selectedEdge = null;
    let lastVisible = { nodes: [], edges: [] };
    let width = 800;
    let height = 500;
    let currentZoomScale = 1;
    const defaultZoomScale = 0.48;
    const maxRenderedEdges = 1800;
    const maxFocusedEdges = 1400;
    const maxLayoutEdges = 2400;

    document.getElementById("nodeCount").textContent = GRAPH.nodes.length;
    document.getElementById("edgeCount").textContent = GRAPH.edges.length;

    const defs = svg.append("defs");
    defs.append("marker")
      .attr("id", "arrow-tool")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 11)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#2563eb")
      .attr("opacity", 0.62);
    defs.append("marker")
      .attr("id", "arrow-ask")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 11)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#ea580c")
      .attr("opacity", 0.7);

    const zoom = d3.zoom()
      .scaleExtent([0.25, 6])
      .on("zoom", (event) => {
        currentZoomScale = event.transform.k;
        zoomLayer.attr("transform", event.transform);
        updateNodeScale();
        updateEdgeScale();
      });
    svg.call(zoom);

    const linkForce = d3.forceLink()
      .id((node) => node.id)
      .distance((edge) => edge.kind === "ask_user" ? 96 : 58)
      .strength((edge) => edge.kind === "ask_user" ? 0.08 : 0.18);

    const simulation = d3.forceSimulation()
      .force("link", linkForce)
      .force("charge", d3.forceManyBody().strength(-18))
      .force("collide", d3.forceCollide().radius((node) => node.toolkit === "user" ? 8 : 6))
      .on("tick", ticked);

    function assignInitialPositions() {
      const groups = {
        googlesuper: allNodes.filter((node) => node.toolkit === "googlesuper"),
        github: allNodes.filter((node) => node.toolkit === "github"),
        user: allNodes.filter((node) => node.toolkit === "user"),
        unknown: allNodes.filter((node) => node.toolkit === "unknown"),
      };
      place(groups.googlesuper, width * 0.34, height * 0.52, Math.min(width, height) * 0.34);
      place(groups.github, width * 0.68, height * 0.52, Math.min(width, height) * 0.30);
      place(groups.user, width * 0.5, height * 0.12, Math.min(width, height) * 0.10);
      place(groups.unknown, width * 0.5, height * 0.88, Math.min(width, height) * 0.10);
    }

    function place(group, centerX, centerY, radius) {
      const golden = Math.PI * (3 - Math.sqrt(5));
      group.forEach((node, index) => {
        const r = radius * Math.sqrt((index + 1) / Math.max(1, group.length));
        const theta = index * golden;
        node.x = centerX + Math.cos(theta) * r;
        node.y = centerY + Math.sin(theta) * r;
      });
    }

    function resize() {
      const rect = stage.getBoundingClientRect();
      width = Math.max(800, rect.width);
      height = Math.max(500, rect.height);
      svg.attr("viewBox", "0 0 " + width + " " + height);
      simulation
        .force("x", d3.forceX((node) => groupCenter(node).x).strength(0.035))
        .force("y", d3.forceY((node) => groupCenter(node).y).strength(0.035));
      simulation.alpha(0.25).restart();
    }

    function groupCenter(node) {
      if (node.toolkit === "googlesuper") return { x: width * 0.34, y: height * 0.52 };
      if (node.toolkit === "github") return { x: width * 0.68, y: height * 0.52 };
      if (node.toolkit === "user") return { x: width * 0.5, y: height * 0.12 };
      return { x: width * 0.5, y: height * 0.88 };
    }

    function visible() {
      const q = query.value.trim().toLowerCase();
      const toolkitFilter = toolkit.value;
      const kindFilter = kind.value;
      const nodes = allNodes.filter((node) => {
        const matchesToolkit = toolkitFilter === "all" || node.toolkit === toolkitFilter;
        const matchesQuery = !q || (node.id + " " + node.displayName + " " + node.description).toLowerCase().includes(q);
        return matchesToolkit && matchesQuery;
      });
      const visibleIds = new Set(nodes.map((node) => node.id));
      const edges = allEdges.filter((edge) => {
        const matchesKind = kindFilter === "all" || edge.kind === kindFilter;
        const matchesQuery = !q || (edge.resource + " " + edge.label + " " + edge.sourceId + " " + edge.targetId).toLowerCase().includes(q);
        return matchesKind && matchesQuery && visibleIds.has(edge.sourceId) && visibleIds.has(edge.targetId);
      });
      return { nodes, edges };
    }

    function updateGraph() {
      const { nodes, edges } = visible();
      lastVisible = { nodes, edges };
      const visibleNodeIds = new Set(nodes.map((node) => node.id));
      if (selectedNode && !visibleNodeIds.has(selectedNode.id)) selectedNode = null;
      if (selectedEdge && !edges.includes(selectedEdge)) selectedEdge = null;

      edgeSelection = edgeLayer.selectAll("path")
        .data([], (edge) => edge.index)
        .join((enter) => enter);

      nodeSelection = nodeLayer.selectAll("circle")
        .data(nodes, (node) => node.id)
        .join((enter) => enter.append("circle")
          .attr("class", "node-dot")
          .attr("fill", (node) => colors[node.toolkit] || colors.unknown)
          .on("mouseenter", (event, node) => {
            hoveredNode = node;
            showTooltip(node, event);
            updateRenderedEdges();
            updateVisualState();
          })
          .on("mousemove", (event, node) => showTooltip(node, event))
          .on("mouseleave", () => {
            hoveredNode = null;
            tooltip.style.display = "none";
            updateRenderedEdges();
            updateVisualState();
          })
          .on("click", (event, node) => {
            event.stopPropagation();
            selectNode(node);
          })
          .call(d3.drag()
            .on("start", dragStarted)
            .on("drag", dragged)
            .on("end", dragEnded)));

      simulation.nodes(nodes);
      linkForce.links(layoutEdges(edges));
      simulation.alpha(0.75).restart();
      renderEdges(edges);
      updateRenderedEdges();
      updateNodeScale();
      updateVisualState();
      if (selectedNode) renderNodeDetails(selectedNode, edges);
      else if (selectedEdge) renderEdgeDetails(selectedEdge);
      else renderEmptyDetails();
    }

    function ticked() {
      edgeSelection.attr("d", linkPath);
      nodeSelection
        .attr("cx", (node) => node.x)
        .attr("cy", (node) => node.y);
    }

    function linkPath(edge) {
      const source = typeof edge.source === "object" ? edge.source : nodeById.get(edge.sourceId);
      const target = typeof edge.target === "object" ? edge.target : nodeById.get(edge.targetId);
      if (!source || !target) return "";
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const nodeOffset = edge.kind === "ask_user" ? 7 : 6;
      const startX = source.x + (dx / distance) * nodeOffset;
      const startY = source.y + (dy / distance) * nodeOffset;
      const endX = target.x - (dx / distance) * nodeOffset;
      const endY = target.y - (dy / distance) * nodeOffset;
      const curve = edge.kind === "ask_user" ? 0 : Math.min(42, distance * 0.18);
      const nx = -dy / distance;
      const ny = dx / distance;
      const cpX = (source.x + target.x) / 2 + nx * curve;
      const cpY = (source.y + target.y) / 2 + ny * curve;
      return "M" + startX + "," + startY + "Q" + cpX + "," + cpY + " " + endX + "," + endY;
    }

    function updateVisualState() {
      const focusNode = selectedNode;
      nodeSelection
        .classed("is-hovered", (node) => node === hoveredNode)
        .classed("is-selected", (node) => node === selectedNode);

      edgeSelection
        .classed("ask-user", (edge) => edge.kind === "ask_user")
        .classed("is-selected", (edge) => edge === selectedEdge)
        .classed("is-connected", (edge) => Boolean(focusNode && (edge.sourceId === focusNode.id || edge.targetId === focusNode.id)))
        .classed("is-muted", (edge) => Boolean(focusNode && edge.sourceId !== focusNode.id && edge.targetId !== focusNode.id && edge !== selectedEdge));
      updateEdgeScale();
    }

    function updateRenderedEdges() {
      edgeSelection = edgeLayer.selectAll("path")
        .data(renderedEdges(), (edge) => edge.index)
        .join(
          (enter) => enter.append("path")
            .attr("class", "edge-path")
            .attr("marker-end", (edge) => edge.kind === "ask_user" ? "url(#arrow-ask)" : "url(#arrow-tool)")
            .on("click", (event, edge) => {
              event.stopPropagation();
              selectEdge(edge);
            }),
          (update) => update,
          (exit) => exit.remove(),
        );
      ticked();
      updateEdgeScale();
    }

    function renderedEdges() {
      const focusNode = selectedNode || hoveredNode;
      if (!focusNode) {
        return sampleEdges(lastVisible.edges, maxRenderedEdges);
      }
      const focusedEdges = lastVisible.edges.filter((edge) => edge.sourceId === focusNode.id || edge.targetId === focusNode.id);
      if (selectedEdge && lastVisible.edges.includes(selectedEdge) && !focusedEdges.includes(selectedEdge)) {
        focusedEdges.unshift(selectedEdge);
      }
      return sampleEdges(focusedEdges, maxFocusedEdges);
    }

    function layoutEdges(edges) {
      const toolEdges = edges.filter((edge) => edge.kind === "tool_dependency");
      return sampleEdges(toolEdges.length ? toolEdges : edges, maxLayoutEdges);
    }

    function sampleEdges(edges, limit) {
      if (edges.length <= limit) {
        return edges;
      }
      const sampled = [];
      const seen = new Set();
      const stride = edges.length / limit;
      for (let index = 0; sampled.length < limit && index < limit; index += 1) {
        const edge = edges[Math.floor(index * stride)];
        if (edge && !seen.has(edge.index)) {
          seen.add(edge.index);
          sampled.push(edge);
        }
      }
      return sampled;
    }

    function nodeRadius(node) {
      return node.toolkit === "user" ? 5.8 : 4.6;
    }

    function edgeStrokeWidth(edge) {
      const focusNode = selectedNode;
      if (edge === selectedEdge) {
        return 2.3;
      }
      if (focusNode && (edge.sourceId === focusNode.id || edge.targetId === focusNode.id)) {
        return 1.9;
      }
      return 1.15;
    }

    function updateNodeScale() {
      nodeSelection
        .attr("r", (node) => nodeRadius(node) / currentZoomScale)
        .style("stroke-width", 2.2 / currentZoomScale);
    }

    function updateEdgeScale() {
      edgeSelection
        .style("stroke-width", (edge) => edgeStrokeWidth(edge) / currentZoomScale)
        .style("stroke-dasharray", (edge) => edge.kind === "ask_user" ? (7 / currentZoomScale) + " " + (5 / currentZoomScale) : null);
    }

    function dragStarted(event, node) {
      if (!event.active) simulation.alphaTarget(0.25).restart();
      node.fx = node.x;
      node.fy = node.y;
    }

    function dragged(event, node) {
      node.fx = event.x;
      node.fy = event.y;
    }

    function dragEnded(event, node) {
      if (!event.active) simulation.alphaTarget(0);
      node.fx = null;
      node.fy = null;
    }

    function resetView() {
      selectedNode = null;
      selectedEdge = null;
      hoveredNode = null;
      tooltip.style.display = "none";
      assignInitialPositions();
      updateGraph();
      svg.transition().duration(450).call(zoom.transform, defaultTransform());
    }

    function defaultTransform() {
      return d3.zoomIdentity
        .translate(width * (1 - defaultZoomScale) / 2, height * (1 - defaultZoomScale) / 2)
        .scale(defaultZoomScale);
    }

    function renderEmptyDetails() {
      details.innerHTML = '<h2>No selection</h2><div class="muted">Select a node or edge to see dependency details.</div>';
    }

    function showTooltip(node, event) {
      if (!node) {
        tooltip.style.display = "none";
        return;
      }
      tooltip.innerHTML = "<b>" + escapeHtml(node.displayName) + "</b><br><span class='muted'>" + escapeHtml(node.id) + "</span>";
      tooltip.style.left = Math.min(window.innerWidth - 380, event.clientX + 14) + "px";
      tooltip.style.top = Math.min(window.innerHeight - 90, event.clientY + 14) + "px";
      tooltip.style.display = "block";
    }

    function renderNodeDetails(node, edges) {
      const incoming = edges.filter((edge) => edge.targetId === node.id);
      const outgoing = edges.filter((edge) => edge.sourceId === node.id);
      details.innerHTML =
        "<h2>" + escapeHtml(node.displayName) + "</h2>" +
        "<div class='muted'>" + escapeHtml(node.id) + " · " + escapeHtml(node.toolkit) + "</div>" +
        (node.description ? "<p>" + escapeHtml(node.description) + "</p>" : "") +
        section("Needs", (node.consumes || []).map((item) => item.label + " (" + item.evidence.join("; ") + ")")) +
        section("Provides", (node.produces || []).map((item) => item.label + " (" + item.evidence.join("; ") + ")")) +
        section("Incoming dependencies", incoming.slice(0, 12).map((edge) => edge.sourceId + " via " + edge.label)) +
        section("Outgoing dependencies", outgoing.slice(0, 12).map((edge) => edge.targetId + " via " + edge.label));
    }

    function renderEdgeDetails(edge) {
      details.innerHTML =
        "<h2>" + escapeHtml(edge.label) + "</h2>" +
        "<div class='muted'>" + escapeHtml(edge.kind) + " · confidence " + edge.confidence + "</div>" +
        "<p><b>" + escapeHtml(edge.sourceId) + "</b> → <b>" + escapeHtml(edge.targetId) + "</b></p>" +
        "<p>" + escapeHtml(edge.evidence) + "</p>";
    }

    function section(title, items) {
      if (!items || items.length === 0) return "";
      return "<b>" + escapeHtml(title) + "</b><ul>" + items.map((item) => "<li>" + escapeHtml(item) + "</li>").join("") + "</ul>";
    }

    function selectEdge(edge) {
      selectedEdge = edge;
      selectedNode = null;
      renderEdgeDetails(edge);
      updateRenderedEdges();
      updateVisualState();
    }

    function selectNode(node) {
      selectedNode = node;
      selectedEdge = null;
      renderNodeDetails(node, lastVisible.edges);
      updateRenderedEdges();
      updateVisualState();
    }

    function clearSelection() {
      selectedNode = null;
      selectedEdge = null;
      renderEmptyDetails();
      updateRenderedEdges();
      updateVisualState();
    }

    function renderEdges(edges) {
      edgeList.innerHTML = edges
        .slice(0, 120)
        .map((edge) => '<div class="edge" data-index="' + edge.index + '"><b>' + escapeHtml(edge.label) + '</b><span class="muted">' + escapeHtml(edge.sourceId) + ' → ' + escapeHtml(edge.targetId) + '</span><br><span class="muted">confidence ' + edge.confidence + ' | ' + edge.kind + '</span></div>')
        .join("") || '<p class="muted">No edges match the current filters.</p>';
      edgeList.querySelectorAll(".edge").forEach((element) => {
        element.addEventListener("click", () => {
          const edge = allEdges[Number(element.dataset.index)];
          if (edge) selectEdge(edge);
        });
      });
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
    }

    svg.on("click", clearSelection);
    resetViewButton.addEventListener("click", (event) => {
      event.stopPropagation();
      resetView();
    });
    addEventListener("resize", () => {
      resize();
      updateGraph();
    });
    query.addEventListener("input", updateGraph);
    toolkit.addEventListener("change", updateGraph);
    kind.addEventListener("change", updateGraph);

    resize();
    assignInitialPositions();
    updateGraph();
    svg.call(zoom.transform, defaultTransform());
  </script>
</body>
</html>
`;
}

function resourceApplies(def: ResourceDefinition, toolkit: Toolkit): boolean {
  return def.toolkit === "any" || def.toolkit === toolkit;
}

function matchingEvidence(patterns: RegExp[], text: string): string[] {
  const normalized = text.replace(/[^a-zA-Z0-9]+/g, "_");
  return patterns
    .filter((pattern) => pattern.test(text) || pattern.test(normalized))
    .map((pattern) => pattern.source);
}

function firstString(object: JsonObject, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = object[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return undefined;
}

function firstObject(object: JsonObject, keys: string[]): JsonObject | undefined {
  for (const key of keys) {
    const value = object[key];
    if (isObject(value)) {
      return value;
    }
  }
  return undefined;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function countBy<TItem, TKey extends string>(
  items: TItem[],
  getKey: (item: TItem) => TKey,
): Record<TKey, number> {
  const counts = {} as Record<TKey, number>;
  for (const item of items) {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function dotEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
