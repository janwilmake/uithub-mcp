# UIThub MCP Server

[![smithery badge](https://smithery.ai/badge/@janwilmake/uithub-mcp)](https://smithery.ai/server/@janwilmake/uithub-mcp)

Model Context Protocol (MCP) server for interacting with the [uithub API](https://uithub.com), which provides a convenient way to fetch GitHub repository contents.

This MCP server allows Claude to retrieve and analyze code from GitHub repositories, making it a powerful tool for understanding and discussing code.

## TODO

- ✅ Simple MCP Server for Claude Desktop
- Make MCP for cursor too https://docs.cursor.com/context/model-context-protocol
- MCP cline support https://github.com/cline/mcp-marketplace
- Button to learn to install MCPs on separate page.
- Add patch api to MCP Server

## Features

- Retrieve repository contents with smart filtering options
- Specify file extensions to include or exclude
- Integrate with Claude Desktop for natural language exploration of repositories

## Installation

### Installing via Smithery

To install uithub-mcp for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@janwilmake/uithub-mcp):

```bash
npx -y @smithery/cli install @janwilmake/uithub-mcp --client claude
```

### Manual Installation
1. `npx uithub-mcp init`
2. restart claude
