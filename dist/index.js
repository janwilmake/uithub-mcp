#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/isexe/windows.js
var require_windows = __commonJS({
  "node_modules/isexe/windows.js"(exports, module) {
    "use strict";
    module.exports = isexe;
    isexe.sync = sync;
    var fs2 = __require("fs");
    function checkPathExt(path2, options) {
      var pathext = options.pathExt !== void 0 ? options.pathExt : process.env.PATHEXT;
      if (!pathext) {
        return true;
      }
      pathext = pathext.split(";");
      if (pathext.indexOf("") !== -1) {
        return true;
      }
      for (var i = 0; i < pathext.length; i++) {
        var p = pathext[i].toLowerCase();
        if (p && path2.substr(-p.length).toLowerCase() === p) {
          return true;
        }
      }
      return false;
    }
    function checkStat(stat, path2, options) {
      if (!stat.isSymbolicLink() && !stat.isFile()) {
        return false;
      }
      return checkPathExt(path2, options);
    }
    function isexe(path2, options, cb) {
      fs2.stat(path2, function(er, stat) {
        cb(er, er ? false : checkStat(stat, path2, options));
      });
    }
    function sync(path2, options) {
      return checkStat(fs2.statSync(path2), path2, options);
    }
  }
});

// node_modules/isexe/mode.js
var require_mode = __commonJS({
  "node_modules/isexe/mode.js"(exports, module) {
    "use strict";
    module.exports = isexe;
    isexe.sync = sync;
    var fs2 = __require("fs");
    function isexe(path2, options, cb) {
      fs2.stat(path2, function(er, stat) {
        cb(er, er ? false : checkStat(stat, options));
      });
    }
    function sync(path2, options) {
      return checkStat(fs2.statSync(path2), options);
    }
    function checkStat(stat, options) {
      return stat.isFile() && checkMode(stat, options);
    }
    function checkMode(stat, options) {
      var mod = stat.mode;
      var uid = stat.uid;
      var gid = stat.gid;
      var myUid = options.uid !== void 0 ? options.uid : process.getuid && process.getuid();
      var myGid = options.gid !== void 0 ? options.gid : process.getgid && process.getgid();
      var u = parseInt("100", 8);
      var g = parseInt("010", 8);
      var o = parseInt("001", 8);
      var ug = u | g;
      var ret = mod & o || mod & g && gid === myGid || mod & u && uid === myUid || mod & ug && myUid === 0;
      return ret;
    }
  }
});

// node_modules/isexe/index.js
var require_isexe = __commonJS({
  "node_modules/isexe/index.js"(exports, module) {
    "use strict";
    var fs2 = __require("fs");
    var core;
    if (process.platform === "win32" || global.TESTING_WINDOWS) {
      core = require_windows();
    } else {
      core = require_mode();
    }
    module.exports = isexe;
    isexe.sync = sync;
    function isexe(path2, options, cb) {
      if (typeof options === "function") {
        cb = options;
        options = {};
      }
      if (!cb) {
        if (typeof Promise !== "function") {
          throw new TypeError("callback not provided");
        }
        return new Promise(function(resolve, reject) {
          isexe(path2, options || {}, function(er, is) {
            if (er) {
              reject(er);
            } else {
              resolve(is);
            }
          });
        });
      }
      core(path2, options || {}, function(er, is) {
        if (er) {
          if (er.code === "EACCES" || options && options.ignoreErrors) {
            er = null;
            is = false;
          }
        }
        cb(er, is);
      });
    }
    function sync(path2, options) {
      try {
        return core.sync(path2, options || {});
      } catch (er) {
        if (options && options.ignoreErrors || er.code === "EACCES") {
          return false;
        } else {
          throw er;
        }
      }
    }
  }
});

// node_modules/which/which.js
var require_which = __commonJS({
  "node_modules/which/which.js"(exports, module) {
    "use strict";
    var isWindows = process.platform === "win32" || process.env.OSTYPE === "cygwin" || process.env.OSTYPE === "msys";
    var path2 = __require("path");
    var COLON = isWindows ? ";" : ":";
    var isexe = require_isexe();
    var getNotFoundError = (cmd2) => Object.assign(new Error(`not found: ${cmd2}`), { code: "ENOENT" });
    var getPathInfo = (cmd2, opt) => {
      const colon = opt.colon || COLON;
      const pathEnv = cmd2.match(/\//) || isWindows && cmd2.match(/\\/) ? [""] : [
        // windows always checks the cwd first
        ...isWindows ? [process.cwd()] : [],
        ...(opt.path || process.env.PATH || /* istanbul ignore next: very unusual */
        "").split(colon)
      ];
      const pathExtExe = isWindows ? opt.pathExt || process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM" : "";
      const pathExt = isWindows ? pathExtExe.split(colon) : [""];
      if (isWindows) {
        if (cmd2.indexOf(".") !== -1 && pathExt[0] !== "")
          pathExt.unshift("");
      }
      return {
        pathEnv,
        pathExt,
        pathExtExe
      };
    };
    var which2 = (cmd2, opt, cb) => {
      if (typeof opt === "function") {
        cb = opt;
        opt = {};
      }
      if (!opt)
        opt = {};
      const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd2, opt);
      const found = [];
      const step = (i) => new Promise((resolve, reject) => {
        if (i === pathEnv.length)
          return opt.all && found.length ? resolve(found) : reject(getNotFoundError(cmd2));
        const ppRaw = pathEnv[i];
        const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
        const pCmd = path2.join(pathPart, cmd2);
        const p = !pathPart && /^\.[\\\/]/.test(cmd2) ? cmd2.slice(0, 2) + pCmd : pCmd;
        resolve(subStep(p, i, 0));
      });
      const subStep = (p, i, ii) => new Promise((resolve, reject) => {
        if (ii === pathExt.length)
          return resolve(step(i + 1));
        const ext = pathExt[ii];
        isexe(p + ext, { pathExt: pathExtExe }, (er, is) => {
          if (!er && is) {
            if (opt.all)
              found.push(p + ext);
            else
              return resolve(p + ext);
          }
          return resolve(subStep(p, i, ii + 1));
        });
      });
      return cb ? step(0).then((res) => cb(null, res), cb) : step(0);
    };
    var whichSync = (cmd2, opt) => {
      opt = opt || {};
      const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd2, opt);
      const found = [];
      for (let i = 0; i < pathEnv.length; i++) {
        const ppRaw = pathEnv[i];
        const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
        const pCmd = path2.join(pathPart, cmd2);
        const p = !pathPart && /^\.[\\\/]/.test(cmd2) ? cmd2.slice(0, 2) + pCmd : pCmd;
        for (let j = 0; j < pathExt.length; j++) {
          const cur = p + pathExt[j];
          try {
            const is = isexe.sync(cur, { pathExt: pathExtExe });
            if (is) {
              if (opt.all)
                found.push(cur);
              else
                return cur;
            }
          } catch (ex) {
          }
        }
      }
      if (opt.all && found.length)
        return found;
      if (opt.nothrow)
        return null;
      throw getNotFoundError(cmd2);
    };
    module.exports = which2;
    which2.sync = whichSync;
  }
});

// src/index.ts
var import_which = __toESM(require_which(), 1);
import dotenv from "dotenv";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { fetch } from "undici";
import { exec } from "child_process";
import { promisify } from "util";
import chalk from "chalk";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "url";
dotenv.config();
var GITHUB_PAT = "";
var __filename = fileURLToPath(import.meta.url);
var execAsync = promisify(exec);
var version = process.env.npm_package_version || "0.1.0";
function createDialog(lines) {
  const maxLineWidth = Math.max(...lines.map((line) => line.length), 60);
  const border = chalk.gray("-".repeat(maxLineWidth));
  return [border, ...lines, border, ""].join("\n");
}
function isDirectory(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (error) {
    return false;
  }
}
async function init() {
  console.log(
    createDialog([
      `\u{1F44B} Welcome to ${chalk.yellow("mcp-server-uithub")} v${version}!`,
      `\u{1F481}\u200D\u2640\uFE0F This ${chalk.green("'init'")} process will install the UIThub MCP Server into Claude Desktop`,
      `   enabling Claude to fetch and analyze GitHub repositories through UIThub.`,
      `\u{1F9E1} Let's get started.`
    ])
  );
  console.log(`${chalk.yellow("Step 1:")} Checking for Claude Desktop...`);
  const claudeConfigPath = path.join(
    os.homedir(),
    "Library",
    "Application Support",
    "Claude",
    "claude_desktop_config.json"
  );
  const cloudflareConfig = {
    command: (await (0, import_which.default)("node")).trim(),
    args: [__filename, "run"]
  };
  console.log(
    `Looking for existing config in: ${chalk.yellow(path.dirname(claudeConfigPath))}`
  );
  const configDirExists = isDirectory(path.dirname(claudeConfigPath));
  if (configDirExists) {
    const existingConfig = fs.existsSync(claudeConfigPath) ? JSON.parse(fs.readFileSync(claudeConfigPath, "utf8")) : { mcpServers: {} };
    if ("uithub" in (existingConfig?.mcpServers || {})) {
      console.log(
        `${chalk.green("Note:")} Replacing existing UIThub MCP config:
${chalk.gray(JSON.stringify(existingConfig.mcpServers.uithub))}`
      );
    }
    const newConfig = {
      ...existingConfig,
      mcpServers: {
        ...existingConfig.mcpServers,
        uithub: cloudflareConfig
      }
    };
    fs.writeFileSync(claudeConfigPath, JSON.stringify(newConfig, null, 2));
    console.log(
      `${chalk.yellow("mcp-server-uithub")} configured & added to Claude Desktop!`
    );
    console.log(`Wrote config to ${chalk.yellow(claudeConfigPath)}`);
    console.log(
      chalk.blue(
        `Try asking Claude to "fetch code from a GitHub repository" to get started!`
      )
    );
  } else {
    const fullConfig = { mcpServers: { uithub: cloudflareConfig } };
    console.log(
      `Couldn't detect Claude Desktop config at ${claudeConfigPath}.
To add the UIThub MCP server manually, add the following config to your ${chalk.yellow("claude_desktop_configs.json")} file:

${JSON.stringify(fullConfig, null, 2)}`
    );
  }
}
if (process.argv[2] === "init") {
  init().then(() => {
    console.log(chalk.green("Initialization complete!"));
  }).catch((error) => {
    console.error(chalk.red("Error during initialization:"), error);
    process.exit(1);
  });
}
dotenv.config();
var debug = process.env.DEBUG === "true";
function log(...args2) {
  if (debug) {
    const msg = `[DEBUG ${(/* @__PURE__ */ new Date()).toISOString()}] ${args2.join(" ")}
`;
    process.stderr.write(msg);
  }
}
var GET_REPOSITORY_CONTENTS_TOOL = {
  name: "getRepositoryContents",
  description: "Get repository contents from GitHub via UIThub API",
  inputSchema: {
    type: "object",
    properties: {
      owner: {
        type: "string",
        description: "GitHub repository owner"
      },
      repo: {
        type: "string",
        description: "GitHub repository name"
      },
      branch: {
        type: "string",
        description: "Branch name (defaults to main if not provided)"
      },
      path: {
        type: "string",
        description: "File or directory path within the repository"
      },
      ext: {
        type: "string",
        description: "Comma-separated list of file extensions to include"
      },
      dir: {
        type: "string",
        description: "Comma-separated list of directories to include"
      },
      excludeExt: {
        type: "string",
        description: "Comma-separated list of file extensions to exclude"
      },
      excludeDir: {
        type: "string",
        description: "Comma-separated list of directories to exclude"
      },
      maxFileSize: {
        type: "integer",
        description: "Maximum file size to include (in bytes)"
      },
      maxTokens: {
        type: "integer",
        description: "Limit the response to a maximum number of tokens (defaults to 50000)"
      },
      omitFiles: {
        type: "boolean",
        description: "If true, response will not include the file contents"
      },
      omitTree: {
        type: "boolean",
        description: "If true, response will not include the directory tree"
      }
    },
    required: ["owner", "repo"]
  }
};
var ALL_TOOLS = [GET_REPOSITORY_CONTENTS_TOOL];
var HANDLERS = {
  getRepositoryContents: async (request) => {
    const {
      owner,
      repo,
      branch = "main",
      path: path2 = "",
      ext,
      dir,
      excludeExt,
      excludeDir,
      maxFileSize,
      maxTokens = 5e4,
      omitFiles,
      omitTree
    } = request.params.arguments;
    log("Executing getRepositoryContents for repo:", `${owner}/${repo}`);
    const params = new URLSearchParams();
    if (ext) params.append("ext", ext);
    if (dir) params.append("dir", dir);
    if (excludeExt) params.append("exclude-ext", excludeExt);
    if (excludeDir) params.append("exclude-dir", excludeDir);
    if (maxFileSize) params.append("maxFileSize", maxFileSize.toString());
    params.append("maxTokens", maxTokens.toString());
    if (omitFiles) params.append("omitFiles", "true");
    if (omitTree) params.append("omitTree", "true");
    const acceptHeader = "text/markdown";
    const headers = {
      Accept: acceptHeader
    };
    if (GITHUB_PAT) {
      params.append("apiKey", GITHUB_PAT);
    }
    const pathSegment = path2 ? `/${path2}` : "";
    const url = `https://uithub.com/${owner}/${repo}/tree/${branch}${pathSegment}?${params.toString()}`;
    log("UIThub API request URL:", url);
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`UIThub API error: ${error}`);
      }
      const responseText = await response.text();
      return {
        content: [
          {
            type: "text",
            text: responseText
          }
        ],
        metadata: {}
      };
    } catch (error) {
      log("Error handling UIThub API request:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        metadata: {},
        isError: true
      };
    }
  }
};
async function main() {
  log("Starting UIThub MCP server...");
  try {
    const server = new Server(
      { name: "uithub", version: "1.0.0" },
      { capabilities: { tools: {} } }
    );
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      log("Received list tools request");
      return { tools: ALL_TOOLS };
    });
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
                text: `Error: ${error instanceof Error ? error.message : String(error)}`
              }
            ],
            isError: true
          }
        };
      }
    });
    const transport = new StdioServerTransport();
    log("Created transport");
    await server.connect(transport);
    log("Server connected and running");
  } catch (error) {
    log("Fatal error:", error);
    process.exit(1);
  }
}
process.on("uncaughtException", (error) => {
  log("Uncaught exception:", error);
});
process.on("unhandledRejection", (error) => {
  log("Unhandled rejection:", error);
});
var [cmd, ...args] = process.argv.slice(2);
if (cmd === "init") {
  init().then(() => {
    console.log("Initialization complete!");
  }).catch((error) => {
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
export {
  init
};
