import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  InitializeRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  InitializeRequest,
  ListResourcesRequest,
  ReadResourceRequest
} from "@modelcontextprotocol/sdk/types.js";
import { readdir } from 'fs/promises';
import { join } from 'path';
import type { Dirent } from 'fs';
import { URL } from 'url';

console.log('Starting MCP server...');

// Initialize server with resource capabilities
const server = new Server({
  name: "mcp-filesys",
  version: "1.0.0",
}, {
  capabilities: {
    resources: {
      "file://": {
        read: true,
        write: true,
        list: true
      },
      "list-contents://": {
        read: true,
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path to list contents of"
            }
          }
        }
      }
    },
  },
});

console.log('Server initialized with capabilities');

// Handle initialization
server.setRequestHandler(InitializeRequestSchema, async (request: InitializeRequest) => {
  console.log('Initialize request received:', JSON.stringify(request, null, 2));
  const response = {
    jsonrpc: "2.0",
    result: {
      protocolVersion: "0.1.0",
      capabilities: {
        resources: {
          "file://": {
            read: true,
            write: true,
            list: true
          },
          "list-contents://": {
            read: true,
            parameters: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "Path to list contents of"
                }
              }
            }
          }
        },
      },
      serverInfo: {
        name: "mcp-filesys",
        version: "1.0.0"
      }
    }
  };
  console.log('Sending initialize response:', JSON.stringify(response, null, 2));
  return response;
});

// Handle JSON-RPC requests
server.setRequestHandler(ListResourcesRequestSchema, async (request: ListResourcesRequest) => {
  console.log('List resources request received:', JSON.stringify(request, null, 2));
  const response = {
    jsonrpc: "2.0",
    result: {
      resources: [
        {
          uri: "list-contents://",
          name: "List contents of folder",
          description: "List contents of the file system folder",
          mimeType: "application/json",
          parameters: {
            type: "object",
            properties: {
              path: { 
                type: "string", 
                description: "Path to the folder",
                default: "."
              },
            },
          },
        },
      ],
    }
  };
  console.log('Sending list resources response:', JSON.stringify(response, null, 2));
  return response;
});

// Handle read requests for resources
server.setRequestHandler(ReadResourceRequestSchema, async (request: ReadResourceRequest) => {
  console.log('Read resource request received:', JSON.stringify(request, null, 2));
  
  const uri = new URL(request.params.uri);
  console.log('Parsed URI:', uri.toString());
  
  if (uri.protocol === 'list-contents:') {
    const parameters = request.params.parameters as { path?: string } | undefined;
    console.log('Parameters:', JSON.stringify(parameters, null, 2));
    const targetPath = parameters?.path || '.';
    console.log('Target path:', targetPath);
    try {
      const items: Dirent[] = await readdir(targetPath, { withFileTypes: true });
      console.log('Directory items:', JSON.stringify(items.map(item => item.name), null, 2));
      const contents = items.map(item => ({
        name: item.name,
        type: item.isDirectory() ? 'directory' : 'file',
        path: join(targetPath, item.name)
      }));
      const response = {
        jsonrpc: "2.0",
        result: {
          contents: [{
            mimeType: "application/json",
            text: JSON.stringify(contents)
          }]
        }
      };
      console.log('Sending list contents response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('Error reading directory:', error);
      throw error;
    }
  }
  
  throw new Error(`Unsupported resource URI: ${request.params.uri}`);
});

// Start server using stdio transport
const transport = new StdioServerTransport();
(async () => {
  try {
    console.log('Connecting to transport...');
    await server.connect(transport);
    console.log('Server connected to transport');
    console.info('{"jsonrpc": "2.0", "method": "log", "params": { "message": "Server running..." }}');
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
})();