import { withSimplerAuth } from "simplerauth-client";

interface Env {
  // Add any environment variables here if needed
}

interface AuthenticatedContext extends ExecutionContext {
  user: {
    id: string;
    name: string;
    username: string;
    profile_image_url?: string;
    verified?: boolean;
  };
  accessToken: string;
  authenticated: boolean;
}

const TOOLS = [
  {
    name: "getRepositoryContents",
    description:
      "Get repository contents from GitHub. Unless otherwise instructed, ensure to always first get the tree only (omitFiles:true) to get an idea of the file structure. Afterwards, use the different filters to get only the context relevant to cater to the user request.",
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
  },
];

async function handleMCPRequest(
  request: Request,
  env: Env,
  ctx: AuthenticatedContext
): Promise<Response> {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Require authentication
  if (!ctx.authenticated) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32001,
          message: "Authentication required. Please login with GitHub first.",
        },
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  let message: any;
  try {
    message = await request.json();
  } catch (error) {
    return createError(null, -32700, "Parse error");
  }

  // Handle initialize
  if (message.method === "initialize") {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: message.id,
        result: {
          protocolVersion: "2025-03-26",
          capabilities: { tools: {} },
          serverInfo: {
            name: "UIThub-Remote-MCP",
            version: "1.0.0",
          },
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // Handle initialized notification
  if (message.method === "notifications/initialized") {
    return new Response(null, {
      status: 202,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Handle tools/list
  if (message.method === "tools/list") {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: message.id,
        result: { tools: TOOLS },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // Handle tools/call
  if (message.method === "tools/call") {
    const { name, arguments: args } = message.params;

    if (name !== "getRepositoryContents") {
      return createError(message.id, -32602, `Unknown tool: ${name}`);
    }

    return await handleGetRepositoryContents(message.id, args, ctx.accessToken);
  }

  return createError(message.id, -32601, `Method not found: ${message.method}`);
}

async function handleGetRepositoryContents(
  messageId: any,
  args: any,
  accessToken: string
): Promise<Response> {
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
  } = args;

  if (!owner || !repo) {
    return createError(
      messageId,
      -32602,
      "Missing required parameters: owner and repo"
    );
  }

  try {
    // Build URLSearchParams for UIThub API
    const params = new URLSearchParams();
    if (ext) params.append("ext", ext);
    if (dir) params.append("dir", dir);
    if (excludeExt) params.append("exclude-ext", excludeExt);
    if (excludeDir) params.append("exclude-dir", excludeDir);
    if (maxFileSize) params.append("maxFileSize", maxFileSize.toString());
    params.append("maxTokens", maxTokens.toString());
    if (omitFiles) params.append("omitFiles", "true");
    if (omitTree) params.append("omitTree", "true");

    // Use the GitHub access token for UIThub API
    if (accessToken) {
      params.append("apiKey", accessToken);
    }

    // Construct the UIThub API URL
    const pathSegment = path ? `/${path}` : "";
    const url = `https://uithub.com/${owner}/${repo}/tree/${branch}${pathSegment}?${params.toString()}`;

    // Make request to UIThub API
    const response = await fetch(url, {
      headers: { Accept: "text/markdown" },
    });

    if (!response.ok) {
      const error = await response.text();
      return createError(messageId, -32603, `UIThub API error: ${error}`);
    }

    const responseText = await response.text();

    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: messageId,
        result: {
          content: [{ type: "text", text: responseText }],
          isError: false,
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    return createError(
      messageId,
      -32603,
      `Error fetching repository contents: ${error.message}`
    );
  }
}

function createError(id: any, code: number, message: string): Response {
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      id,
      error: { code, message },
    }),
    {
      status: 200, // JSON-RPC errors use 200 status
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

// Main handler wrapped with SimplerAuth
async function handler(
  request: Request,
  env: Env,
  ctx: AuthenticatedContext
): Promise<Response> {
  const url = new URL(request.url);

  // Handle MCP endpoint
  if (url.pathname === "/mcp") {
    return handleMCPRequest(request, env, ctx);
  }

  // Handle root - show connection instructions
  if (url.pathname === "/") {
    const loginUrl = ctx.authenticated
      ? ""
      : `<p><a href="/authorize">Login with GitHub</a> first to use the MCP server.</p>`;

    console.log({ user: ctx.user });
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>UIThub Remote MCP Server</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
          pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto; }
          .user-info { background: #e8f5e9; padding: 1rem; border-radius: 4px; margin: 1rem 0; }
        </style>
      </head>
      <body>
        <h1>UIThub Remote MCP Server</h1>
        
        ${
          ctx.authenticated
            ? `
          <div class="user-info">
            <strong>Logged in as:</strong> ${ctx.user.name || ""} @${
                ctx.user.login || ctx.user.username
              }
          </div>
        `
            : loginUrl
        }
        
        <p>This is a remote MCP server that provides access to GitHub repositories through UIThub API.</p>
        
        <h2>Usage</h2>
        <p>Connect your MCP client to:</p>
        <pre>${url.origin}/mcp</pre>
        
        <p>Available tools:</p>
        <ul>
          <li><strong>getRepositoryContents</strong> - Get repository contents from GitHub with filtering options</li>
        </ul>
        
        <h2>Authentication</h2>
        <p>This server requires GitHub authentication. Your GitHub access token will be used to make requests to the UIThub API, allowing access to private repositories if you have permission.</p>
        
        ${ctx.authenticated ? `<p><a href="/logout">Logout</a></p>` : ""}
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  // Handle 404
  return new Response("Not Found", { status: 404 });
}

// Export the handler wrapped with SimplerAuth
export default {
  fetch: withSimplerAuth(handler, {
    isLoginRequired: false, // We handle auth manually for MCP endpoint
    oauthProviderHost: "gh.simplerauth.com",
    scope: "repo read:user",
  }),
};
