# Model Context Protocol (MCP) Server

This is a template implementation of a Model Context Protocol server that manages context and conversations for AI applications.

## Features

- Context management
- Conversation tracking
- Message history
- RESTful API endpoints

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the server:
```bash
python mcp_server.py
```

The server will start on `http://localhost:8000`

## API Endpoints

### Context Management
- `POST /context/` - Create a new context
- `GET /context/{context_id}` - Retrieve a context

### Conversation Management
- `POST /conversation/` - Create a new conversation
- `GET /conversation/{conversation_id}` - Retrieve a conversation
- `POST /message/{conversation_id}` - Add a message to a conversation

## Example Usage

1. Create a new context:
```bash
curl -X POST "http://localhost:8000/context/" -H "Content-Type: application/json" -d '{"user_id": "123", "session_type": "chat"}'
```

2. Create a conversation:
```bash
curl -X POST "http://localhost:8000/conversation/" -H "Content-Type: application/json" -d '{"context_id": "ctx_123", "metadata": {"topic": "general"}}'
```

3. Add a message:
```bash
curl -X POST "http://localhost:8000/message/conv_123" -H "Content-Type: application/json" -d '{"role": "user", "content": "Hello, world!", "timestamp": "2023-10-20T12:00:00Z"}'
```

## API Documentation

Once the server is running, you can access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc` 