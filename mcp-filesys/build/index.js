import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListResourcesRequestSchema, ReadResourceRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { readdir } from 'fs/promises';
import { join } from 'path';
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
            },
            "hello://world": {
                read: true,
            },
            "list-contents://": {
                read: true,
            }
        },
    },
});
// List available resources when clients request them
server.setRequestHandler(ListResourcesRequestSchema, async (request) => {
    console.log('List resources request:', JSON.stringify(request, null, 2));
    const response = {
        resources: [
            {
                uri: "hello://world",
                name: "Hello World Message",
                description: "A simple greeting message",
                mimeType: "text/plain",
            },
            {
                uri: "list-contents://",
                name: "List contents of folder",
                description: "List contents of the file system folder",
                mimeType: "application/json",
                parameters: {
                    type: "object",
                    properties: {
                        path: { type: "string", description: "Path to the folder" },
                    },
                },
            },
        ],
    };
    console.log('List resources response:', JSON.stringify(response, null, 2));
    return response;
});
// Return resource content when clients request it
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    console.log('Read resource request:', JSON.stringify(request, null, 2));
    if (request.params.uri === "hello://world") {
        const response = {
            contents: [
                {
                    uri: "hello://world",
                    mimeType: "text/plain",
                    text: "Hello, World! This is my first MCP resource.",
                },
            ],
        };
        console.log('Hello world response:', JSON.stringify(response, null, 2));
        return response;
    }
    if (request.params.uri === "list-contents://") {
        const parameters = request.params.parameters;
        const path = parameters?.path || '.';
        try {
            const items = await readdir(path, { withFileTypes: true });
            const contents = items.map(item => ({
                name: item.name,
                type: item.isDirectory() ? 'directory' : 'file',
                path: join(path, item.name)
            }));
            const response = {
                contents: [
                    {
                        uri: "list-contents://",
                        mimeType: "application/json",
                        text: JSON.stringify(contents, null, 2),
                    },
                ],
            };
            console.log('List contents response:', JSON.stringify(response, null, 2));
            return response;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error reading directory:', errorMessage);
            throw new Error(`Failed to read directory: ${errorMessage}`);
        }
    }
    console.error('Resource not found:', request.params.uri);
    throw new Error(`Resource not found: ${request.params.uri}`);
});
// Start server using stdio transport
const transport = new StdioServerTransport();
(async () => {
    await server.connect(transport);
    console.info('{"jsonrpc": "2.0", "method": "log", "params": { "message": "Server running..." }}');
})();
