import { ForeverYoursAgent } from "../core/agent.js";

export interface IncomingMessage {
  channelId: string;
  userId: string;
  userName: string;
  content: string;
  platform: string;
  replyTo?: string;
}

export interface OutgoingMessage {
  content: string;
  channelId: string;
  replyTo?: string;
}

export interface Channel {
  name: string;
  platform: string;
  connect(agent: ForeverYoursAgent): Promise<void>;
  disconnect(): Promise<void>;
  send(message: OutgoingMessage): Promise<void>;
}
