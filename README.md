# UIThub MCP Server

Model Context Protocol (MCP) server for interacting with the [UIThub API](https://uithub.com), which provides a convenient way to fetch GitHub repository contents.

This MCP server allows Claude to retrieve and analyze code from GitHub repositories, making it a powerful tool for understanding and discussing code.

## Features

- Retrieve repository contents with smart filtering options
- Specify file extensions to include or exclude
- Limit response size by token count or file size
- Choose output format (JSON, YAML, Markdown, HTML)
- Integrate with Claude Desktop for natural language exploration of repositories

## Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/mcp-server-uithub.git
   cd mcp-server-uithub
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Build the project
   ```bash
   npm run build
   # or
   pnpm build
   ```

4. Initialize the server with Claude Desktop
   ```bash
   node dist/index.js init
   ```

## Usage with Claude Desktop

After initializing the server, restart Claude Desktop. You should see a 🔨 icon that shows the UIThub tool available for use.

You can then ask Claude to fetch and analyze code from GitHub repositories, for example:

- "Can you fetch the React components from facebook/react repository and explain how they work?"
- "Get the README file from microsoft/TypeScript repository and summarize it for me."
- "Show me only Python files from tensorflow/tensorflow repository."

## Tool Reference

### getRepositoryContents

Fetches contents from a GitHub repository via the UIThub API.

Parameters:
- `owner` (required): GitHub repository owner
- `repo` (required): GitHub repository name
- `branch`: Branch name (defaults to main)
- `path`: File or directory path within the repository
- `ext`: Comma-separated list of file extensions to include (e.g., "js,ts,jsx")
- `dir`: Comma-separated list of directories to include
- `excludeExt`: Comma-separated list of file extensions to exclude
- `excludeDir`: Comma-separated list of directories to exclude
- `maxFileSize`: Maximum file size to include (in bytes)
- `maxTokens`: Limit response to a maximum number of tokens (useful for LLMs)
- `omitFiles`: If true, response will not include file contents
- `omitTree`: If true, response will not include the directory tree
- `format`: Response format, one of: "json", "yaml", "markdown", "html"

## Environment Variables

You can configure the server by creating a `.env` file with the following variables:

```
# Your GitHub API token for accessing private repositories and higher rate limits
GITHUB_API_KEY=your_github_token

# Set to "true" to enable debug logging
DEBUG=false
```

## Development

For development, you can use the watch mode:

```bash
npm run build:watch
# or
pnpm build:watch
```

## License

MIT