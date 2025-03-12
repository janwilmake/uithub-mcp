#!/usr/bin/env node
import { init } from "./init";
import dotenv from "dotenv";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { fetch } from "undici";
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
const config = {
    apiKey: process.env.GITHUB_API_KEY || "",
};
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
                description: "Limit the response to a maximum number of tokens (defaults to 50000)",
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
        const { owner, repo, branch = "main", path = "", ext, dir, excludeExt, excludeDir, maxFileSize, maxTokens = 50000, omitFiles, omitTree, } = request.params.arguments;
        log("Executing getRepositoryContents for repo:", `${owner}/${repo}`);
        // Build URLSearchParams
        const params = new URLSearchParams();
        if (ext)
            params.append("ext", ext);
        if (dir)
            params.append("dir", dir);
        if (excludeExt)
            params.append("exclude-ext", excludeExt);
        if (excludeDir)
            params.append("exclude-dir", excludeDir);
        if (maxFileSize)
            params.append("maxFileSize", maxFileSize.toString());
        params.append("maxTokens", maxTokens.toString());
        if (omitFiles)
            params.append("omitFiles", "true");
        if (omitTree)
            params.append("omitTree", "true");
        // Always use markdown format
        const acceptHeader = "text/markdown";
        // Prepare headers
        const headers = {
            Accept: acceptHeader,
        };
        // Add GitHub API key if available
        if (config.apiKey) {
            params.append("apiKey", config.apiKey);
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
        }
        catch (error) {
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
        const server = new Server({ name: "uithub", version: "1.0.0" }, { capabilities: { tools: {} } });
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
            }
            catch (error) {
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
    }
    catch (error) {
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
}
else if (cmd === "run") {
    main().catch((error) => {
        console.error("Error starting server:", error);
        process.exit(1);
    });
}
else {
    console.error(`Unknown command: ${cmd}. Expected 'init' or 'run'.`);
    process.exit(1);
}
