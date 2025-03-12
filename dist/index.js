#!/usr/bin/env node
import dotenv from "dotenv";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { fetch } from "undici";
import { exec } from "child_process";
import { promisify } from "util";
import chalk from "chalk";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "url";
import which from "which";
dotenv.config();
const GITHUB_PAT = "";
const __filename = fileURLToPath(import.meta.url);
const execAsync = promisify(exec);
const version = process.env.npm_package_version || "0.1.0";
/**
 * Creates a simple dialog box with a border
 */
function createDialog(lines) {
  const maxLineWidth = Math.max(...lines.map((line) => line.length), 60);
  const border = chalk.gray("-".repeat(maxLineWidth));
  return [border, ...lines, border, ""].join("\n");
}
/**
 * Check if a directory exists
 */
function isDirectory(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (error) {
    return false;
  }
}
/**
 * Initialize the UIThub MCP server
 */
export async function init() {
  console.log(
    createDialog([
      `👋 Welcome to ${chalk.yellow("mcp-server-uithub")} v${version}!`,
      `💁‍♀️ This ${chalk.green("'init'")} process will install the UIThub MCP Server into Claude Desktop`,
      `   enabling Claude to fetch and analyze GitHub repositories through UIThub.`,
      `🧡 Let's get started.`,
    ]),
  );
  console.log(`${chalk.yellow("Step 1:")} Checking for Claude Desktop...`);
  const claudeConfigPath = path.join(
    os.homedir(),
    "Library",
    "Application Support",
    "Claude",
    "claude_desktop_config.json",
  );
  const cloudflareConfig = {
    command: (await which("node")).trim(),
    args: [__filename, "run"],
  };
  console.log(
    `Looking for existing config in: ${chalk.yellow(path.dirname(claudeConfigPath))}`,
  );
  const configDirExists = isDirectory(path.dirname(claudeConfigPath));
  if (configDirExists) {
    const existingConfig = fs.existsSync(claudeConfigPath)
      ? JSON.parse(fs.readFileSync(claudeConfigPath, "utf8"))
      : { mcpServers: {} };
    if ("uithub" in (existingConfig?.mcpServers || {})) {
      console.log(
        `${chalk.green("Note:")} Replacing existing UIThub MCP config:\n${chalk.gray(JSON.stringify(existingConfig.mcpServers.uithub))}`,
      );
    }
    const newConfig = {
      ...existingConfig,
      mcpServers: {
        ...existingConfig.mcpServers,
        uithub: cloudflareConfig,
      },
    };
    fs.writeFileSync(claudeConfigPath, JSON.stringify(newConfig, null, 2));
    console.log(
      `${chalk.yellow("mcp-server-uithub")} configured & added to Claude Desktop!`,
    );
    console.log(`Wrote config to ${chalk.yellow(claudeConfigPath)}`);
    console.log(
      chalk.blue(
        `Try asking Claude to "fetch code from a GitHub repository" to get started!`,
      ),
    );
  } else {
    const fullConfig = { mcpServers: { uithub: cloudflareConfig } };
    console.log(
      `Couldn't detect Claude Desktop config at ${claudeConfigPath}.\nTo add the UIThub MCP server manually, add the following config to your ${chalk.yellow("claude_desktop_configs.json")} file:\n\n${JSON.stringify(fullConfig, null, 2)}`,
    );
  }
}
// This section runs when this file is directly executed
if (process.argv[2] === "init") {
  init()
    .then(() => {
      console.log(chalk.green("Initialization complete!"));
    })
    .catch((error) => {
      console.error(chalk.red("Error during initialization:"), error);
      process.exit(1);
    });
}
// Load environment variables
dotenv.config();
// Debug logging
const debug = process.env.DEBUG === "true";
function log(...args) {
  if (debug) {
    const msg = `[DEBUG ${new Date().toISOString()}] ${args.join(" ")}\n`;
    process.stderr.write(msg);
  }
}
// Configuration
const config = {};
// Define the UIThub getRepositoryContents tool
const GET_REPOSITORY_CONTENTS_TOOL = {
  name: "getRepositoryContents",
  description: "Get repository contents from GitHub via UIThub API",
  inputSchema: {
    type: "object",
    properties: {
      owner: {
        type: "string",
        description: "GitHub repository owner",
      },
      repo: {
        type: "string",
        description: "GitHub repository name",
      },
      branch: {
        type: "string",
        description: "Branch name (defaults to main if not provided)",
      },
      path: {
        type: "string",
        description: "File or directory path within the repository",
      },
      ext: {
        type: "string",
        description: "Comma-separated list of file extensions to include",
      },
      dir: {
        type: "string",
        description: "Comma-separated list of directories to include",
      },
      excludeExt: {
        type: "string",
        description: "Comma-separated list of file extensions to exclude",
      },
      excludeDir: {
        type: "string",
        description: "Comma-separated list of directories to exclude",
      },
      maxFileSize: {
        type: "integer",
        description: "Maximum file size to include (in bytes)",
      },
      maxTokens: {
        type: "integer",
        description:
          "Limit the response to a maximum number of tokens (defaults to 50000)",
      },
      omitFiles: {
        type: "boolean",
        description: "If true, response will not include the file contents",
      },
      omitTree: {
        type: "boolean",
        description: "If true, response will not include the directory tree",
      },
    },
    required: ["owner", "repo"],
  },
};
// All tools
const ALL_TOOLS = [GET_REPOSITORY_CONTENTS_TOOL];
// Tool handlers
const HANDLERS = {
  getRepositoryContents: async (request) => {
    const {
      owner,
      repo,
      branch = "main",
      path = "",
      ext,
      dir,
      excludeExt,
      excludeDir,
      maxFileSize,
      maxTokens = 50000,
      omitFiles,
      omitTree,
    } = request.params.arguments;
    log("Executing getRepositoryContents for repo:", `${owner}/${repo}`);
    // Build URLSearchParams
    const params = new URLSearchParams();
    if (ext) params.append("ext", ext);
    if (dir) params.append("dir", dir);
    if (excludeExt) params.append("exclude-ext", excludeExt);
    if (excludeDir) params.append("exclude-dir", excludeDir);
    if (maxFileSize) params.append("maxFileSize", maxFileSize.toString());
    params.append("maxTokens", maxTokens.toString());
    if (omitFiles) params.append("omitFiles", "true");
    if (omitTree) params.append("omitTree", "true");
    // Always use markdown format
    const acceptHeader = "text/markdown";
    // Prepare headers
    const headers = {
      Accept: acceptHeader,
    };
    // Add GitHub API key if available
    if (GITHUB_PAT) {
      params.append("apiKey", GITHUB_PAT);
    }
    // Construct the URL
    const pathSegment = path ? `/${path}` : "";
    const url = `https://uithub.com/${owner}/${repo}/tree/${branch}${pathSegment}?${params.toString()}`;
    log("UIThub API request URL:", url);
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`UIThub API error: ${error}`);
      }
      // Get markdown response
      const responseText = await response.text();
      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
        ],
        metadata: {},
      };
    } catch (error) {
      log("Error handling UIThub API request:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        metadata: {},
        isError: true,
      };
    }
  },
};
// Start the MCP server
async function main() {
  log("Starting UIThub MCP server...");
  try {
    const server = new Server(
      { name: "uithub", version: "1.0.0" },
      { capabilities: { tools: {} } },
    );
    // Handle list tools request
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      log("Received list tools request");
      return { tools: ALL_TOOLS };
    });
    // Handle tool calls
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      log("Received tool call:", toolName);
      try {
        const handler = HANDLERS[toolName];
        if (!handler) {
          throw new Error(`Unknown tool: ${toolName}`);
        }
        return await handler(request);
      } catch (error) {
        log("Error handling tool call:", error);
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          },
        };
      }
    });
    // Connect to transport
    const transport = new StdioServerTransport();
    log("Created transport");
    await server.connect(transport);
    log("Server connected and running");
  } catch (error) {
    log("Fatal error:", error);
    process.exit(1);
  }
}
// Handle process events
process.on("uncaughtException", (error) => {
  log("Uncaught exception:", error);
});
process.on("unhandledRejection", (error) => {
  log("Unhandled rejection:", error);
});
// Handle command line arguments
const [cmd, ...args] = process.argv.slice(2);
if (cmd === "init") {
  init()
    .then(() => {
      console.log("Initialization complete!");
    })
    .catch((error) => {
      console.error("Error during initialization:", error);
      process.exit(1);
    });
} else if (cmd === "run") {
  main().catch((error) => {
    console.error("Error starting server:", error);
    process.exit(1);
  });
} else {
  console.error(`Unknown command: ${cmd}. Expected 'init' or 'run'.`);
  process.exit(1);
}
