import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'url';
import which from 'which';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const execAsync = promisify(exec);
const version = process.env.npm_package_version || '0.1.0';

/**
 * Creates a simple dialog box with a border
 */
function createDialog(lines: string[]) {
  const maxLineWidth = Math.max(...lines.map((line) => line.length), 60);
  const border = chalk.gray('-'.repeat(maxLineWidth));
  return [border, ...lines, border, ''].join('\n');
}

/**
 * Check if a directory exists
 */
function isDirectory(dirPath: string) {
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
      `👋 Welcome to ${chalk.yellow('mcp-server-uithub')} v${version}!`,
      `💁‍♀️ This ${chalk.green("'init'")} process will install the UIThub MCP Server into Claude Desktop`,
      `   enabling Claude to fetch and analyze GitHub repositories through UIThub.`,
      `🧡 Let's get started.`,
    ])
  );

  console.log(`${chalk.yellow('Step 1:')} Checking for Claude Desktop...`);
  
  const claudeConfigPath = path.join(
    os.homedir(),
    'Library',
    'Application Support',
    'Claude',
    'claude_desktop_config.json'
  );
  
  const cloudflareConfig = {
    command: (await which('node')).trim(),
    args: [__filename, 'run'],
  };

  console.log(`Looking for existing config in: ${chalk.yellow(path.dirname(claudeConfigPath))}`);
  const configDirExists = isDirectory(path.dirname(claudeConfigPath));
  
  if (configDirExists) {
    const existingConfig = fs.existsSync(claudeConfigPath)
      ? JSON.parse(fs.readFileSync(claudeConfigPath, 'utf8'))
      : { mcpServers: {} };
      
    if ('uithub' in (existingConfig?.mcpServers || {})) {
      console.log(
        `${chalk.green('Note:')} Replacing existing UIThub MCP config:\n${chalk.gray(JSON.stringify(existingConfig.mcpServers.uithub))}`
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

    console.log(`${chalk.yellow('mcp-server-uithub')} configured & added to Claude Desktop!`);
    console.log(`Wrote config to ${chalk.yellow(claudeConfigPath)}`);
    console.log(chalk.blue(`Try asking Claude to "fetch code from a GitHub repository" to get started!`));
  } else {
    const fullConfig = { mcpServers: { uithub: cloudflareConfig } };
    console.log(
      `Couldn't detect Claude Desktop config at ${claudeConfigPath}.\nTo add the UIThub MCP server manually, add the following config to your ${chalk.yellow('claude_desktop_configs.json')} file:\n\n${JSON.stringify(fullConfig, null, 2)}`
    );
  }

  // Create a .env file if it doesn't exist
  if (!fs.existsSync('.env')) {
    fs.copyFileSync('.env.template', '.env');
    console.log(`${chalk.green('✓')} Created .env file from template.`);
    console.log(`${chalk.yellow('⚠️')} Edit the .env file to add your GitHub API token if you want to access private repositories.`);
  }
}

// This section runs when this file is directly executed
if (process.argv[2] === 'init') {
  init()
    .then(() => {
      console.log(chalk.green('Initialization complete!'));
    })
    .catch((error) => {
      console.error(chalk.red('Error during initialization:'), error);
      process.exit(1);
    });
}