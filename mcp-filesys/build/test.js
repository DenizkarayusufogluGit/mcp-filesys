import { spawn } from 'child_process';
import { stdin, stdout } from 'process';
import { createInterface } from 'readline';
// Create interface for reading from stdin
const rl = createInterface({
    input: stdin,
    output: stdout
});
// Spawn the MCP server
const server = spawn('node', ['build/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
});
// Handle server output
server.stdout.on('data', (data) => {
    const output = data.toString().trim();
    console.log('\nRaw server output:', output);
    try {
        const responses = output.split('\n').filter((line) => line.trim());
        for (const response of responses) {
            const parsed = JSON.parse(response);
            console.log('\nParsed response:', JSON.stringify(parsed, null, 2));
            if (parsed.method === 'log') {
                console.log('\nServer log:', parsed.params.message);
            }
            else if (parsed.result) {
                if (parsed.result.contents) {
                    for (const content of parsed.result.contents) {
                        if (content.mimeType === 'application/json') {
                            console.log('\nServer response:', JSON.parse(content.text));
                        }
                        else {
                            console.log('\nServer response:', content.text);
                        }
                    }
                }
                else if (parsed.result.resources) {
                    console.log('\nAvailable resources:', JSON.stringify(parsed.result.resources, null, 2));
                }
                else {
                    console.log('\nServer response:', JSON.stringify(parsed.result, null, 2));
                }
            }
            else if (parsed.error) {
                console.error('\nServer error:', parsed.error);
            }
        }
    }
    catch (e) {
        console.error('Error parsing response:', e);
        console.log('Raw output:', output);
    }
});
// Handle server errors
server.stderr.on('data', (data) => {
    console.error('Server error:', data.toString());
});
let requestId = 0;
// Function to send JSON-RPC request
function sendRequest(method, params) {
    const id = ++requestId;
    const request = {
        jsonrpc: '2.0',
        id,
        method,
        params
    };
    const requestStr = JSON.stringify(request) + '\n';
    console.log('\nSending request:', JSON.stringify(request, null, 2));
    server.stdin.write(requestStr);
    return id;
}
// Test the list-contents endpoint
function testListContents(path = '.') {
    sendRequest('readResource', {
        uri: 'list-contents://',
        parameters: {
            path
        }
    });
}
// Test the hello-world endpoint
function testHelloWorld() {
    sendRequest('readResource', {
        uri: 'hello://world'
    });
}
// List available resources
function listResources() {
    sendRequest('listResources', {});
}
// Interactive testing
console.log('MCP Server Test Client');
console.log('1. Test hello-world');
console.log('2. Test list-contents');
console.log('3. List available resources');
console.log('4. Exit');
rl.on('line', (input) => {
    switch (input.trim()) {
        case '1':
            testHelloWorld();
            break;
        case '2':
            rl.question('Enter path to list (default: .): ', (path) => {
                testListContents(path || '.');
            });
            break;
        case '3':
            listResources();
            break;
        case '4':
            server.kill();
            rl.close();
            break;
        default:
            console.log('Invalid option');
    }
});
// Handle server exit
server.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
    rl.close();
});
