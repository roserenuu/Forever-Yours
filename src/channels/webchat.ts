import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import { Channel, OutgoingMessage } from "./types.js";
import { ForeverYoursAgent } from "../core/agent.js";

export class WebChatChannel implements Channel {
  name = "webchat";
  platform = "web";
  private app = express();
  private server: http.Server | null = null;
  private wss: WebSocketServer | null = null;
  private agent: ForeverYoursAgent | null = null;
  private port: number;
  private clients: Map<string, WebSocket> = new Map();

  constructor(port = 3000) {
    this.port = port;
  }

  async connect(agent: ForeverYoursAgent): Promise<void> {
    this.agent = agent;

    this.app.use(express.static("public"));
    this.app.get("/", (_req, res) => {
      res.send(this.getChatHTML());
    });

    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on("connection", (ws: WebSocket) => {
      const clientId = crypto.randomUUID();
      this.clients.set(clientId, ws);

      ws.send(
        JSON.stringify({
          type: "welcome",
          content:
            "Welcome to Jesus Forever Yours. You are seen, loved, and never walking alone. How can I encourage you today?",
        })
      );

      ws.on("message", async (data: Buffer) => {
        try {
          const { content } = JSON.parse(data.toString());
          if (!content?.trim()) return;

          ws.send(JSON.stringify({ type: "typing", content: true }));

          const response = await this.agent!.chat(content);

          ws.send(
            JSON.stringify({
              type: "message",
              content: response.text,
              files: response.files,
              from: "Forever Yours",
            })
          );
        } catch (error) {
          console.error("[WebChat] Error:", error);
          ws.send(
            JSON.stringify({
              type: "message",
              content:
                "Something went wrong on my end — but God never glitches. Try again?",
              from: "Forever Yours",
            })
          );
        }
      });

      ws.on("close", () => {
        this.clients.delete(clientId);
      });
    });

    return new Promise((resolve, reject) => {
      this.server!.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          console.log(
            `  [WebChat] Port ${this.port} is in use — trying ${this.port + 1}`
          );
          this.port++;
          this.server!.listen(this.port);
        } else {
          reject(err);
        }
      });
      this.server!.listen(this.port, () => {
        console.log(
          `[WebChat] Jesus Forever Yours chat is live at http://localhost:${this.port}`
        );
        resolve();
      });
    });
  }

  async disconnect(): Promise<void> {
    for (const ws of this.clients.values()) {
      ws.close();
    }
    this.wss?.close();
    this.server?.close();
    console.log("[WebChat] Disconnected");
  }

  async send(message: OutgoingMessage): Promise<void> {
    const ws = this.clients.get(message.channelId);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "message",
          content: message.content,
          from: "Forever Yours",
        })
      );
    }
  }

  private getChatHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jesus Forever Yours</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Georgia', serif;
      background: linear-gradient(135deg, #fdf6f0 0%, #f5e6d8 50%, #fce4ec 100%);
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #3e2723;
    }
    .chat-container {
      width: 100%;
      max-width: 500px;
      height: 90vh;
      background: rgba(255,255,255,0.95);
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .header {
      padding: 20px;
      text-align: center;
      background: linear-gradient(135deg, #d4a574, #c48b6a);
      color: white;
    }
    .header h1 {
      font-size: 1.4rem;
      font-weight: 400;
      letter-spacing: 2px;
    }
    .header p {
      font-size: 0.8rem;
      opacity: 0.9;
      margin-top: 4px;
      font-style: italic;
    }
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .message {
      max-width: 85%;
      padding: 12px 16px;
      border-radius: 18px;
      line-height: 1.5;
      font-size: 0.95rem;
      white-space: pre-wrap;
    }
    .message.agent {
      background: #fdf6f0;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .message.user {
      background: linear-gradient(135deg, #d4a574, #c48b6a);
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .typing {
      align-self: flex-start;
      font-style: italic;
      color: #999;
      font-size: 0.85rem;
    }
    .input-area {
      padding: 16px;
      border-top: 1px solid #f0e0d0;
      display: flex;
      gap: 10px;
    }
    .input-area input {
      flex: 1;
      padding: 12px 16px;
      border: 2px solid #e8d5c4;
      border-radius: 24px;
      font-family: inherit;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .input-area input:focus { border-color: #d4a574; }
    .input-area button {
      padding: 12px 20px;
      background: linear-gradient(135deg, #d4a574, #c48b6a);
      color: white;
      border: none;
      border-radius: 24px;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.95rem;
      transition: transform 0.1s;
    }
    .input-area button:hover { transform: scale(1.05); }
  </style>
</head>
<body>
  <div class="chat-container">
    <div class="header">
      <h1>JESUS FOREVER YOURS</h1>
      <p>You are seen. You are loved. You are His.</p>
    </div>
    <div class="messages" id="messages"></div>
    <div class="input-area">
      <input type="text" id="input" placeholder="Share what's on your heart..." autocomplete="off" />
      <button onclick="sendMessage()">Send</button>
    </div>
  </div>
  <script>
    const ws = new WebSocket(\`ws://\${location.host}\`);
    const messages = document.getElementById('messages');
    const input = document.getElementById('input');
    let typingEl = null;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'typing') {
        if (!typingEl) {
          typingEl = document.createElement('div');
          typingEl.className = 'typing';
          typingEl.textContent = 'Writing with love...';
          messages.appendChild(typingEl);
          messages.scrollTop = messages.scrollHeight;
        }
        return;
      }
      if (typingEl) { typingEl.remove(); typingEl = null; }
      if (data.type === 'welcome' || data.type === 'message') {
        addMessage(data.content, 'agent');
      }
    };

    function addMessage(text, type) {
      const div = document.createElement('div');
      div.className = 'message ' + type;
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function sendMessage() {
      const content = input.value.trim();
      if (!content) return;
      addMessage(content, 'user');
      ws.send(JSON.stringify({ content }));
      input.value = '';
    }

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  </script>
</body>
</html>`;
  }
}
