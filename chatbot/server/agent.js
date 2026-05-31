import { ChatGroq } from '@langchain/groq';
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

import { scheduleTestDriveTool } from './tools/scheduleTestDrive.js';
import { inquireAboutCarTool } from './tools/inquireAboutCar.js';
import { checkInventoryTool } from './tools/checkInventory.js';
import { callDealershipTool } from './tools/callDealership.js';
import { getFinancingEstimateTool } from './tools/getFinancingEstimate.js';
import { captureLeadTool } from './tools/captureLead.js';

const SYSTEM_PROMPT = `You are Alex, a friendly and professional virtual assistant for a car dealership.

Your personality:
- Warm, approachable, and enthusiastic about helping customers
- Professional and knowledgeable about vehicles and financing
- Concise — keep responses clear and to the point (2–4 sentences unless using a tool)
- Never pushy or salesy — focus on genuinely helping the customer

You can help customers with:
1. Scheduling test drives (use schedule_test_drive tool)
2. Getting details about specific vehicles (use inquire_about_car tool)
3. Browsing available inventory by type (use check_inventory tool)
4. Requesting a callback from our sales team (use call_dealership tool)
5. Getting financing estimates (use get_financing_estimate tool)
6. Saving their contact info for follow-up (use capture_lead tool)

Important guidelines:
- When a customer wants to take an action (schedule, inquire, etc.), collect ALL required information naturally through conversation before calling a tool
- If a customer mentions a vehicle, proactively ask if they'd like to know more or schedule a test drive
- Always confirm details before booking appointments
- If you don't know something specific, say so honestly and offer to connect them with the team
- Never make up prices, availability, or details — use the tools for accurate information

Today's date context: You are operating at a dealership that carries Toyota, Honda, Ford, BMW, Hyundai, Tesla, Chevrolet, RAM, and Mazda vehicles.`;

const tools = [
  scheduleTestDriveTool,
  inquireAboutCarTool,
  checkInventoryTool,
  callDealershipTool,
  getFinancingEstimateTool,
  captureLeadTool,
];

const llm = new ChatGroq({
  model: 'llama3-70b-8192',
  temperature: 0.7,
  apiKey: process.env.GROQ_API_KEY,
});

const prompt = ChatPromptTemplate.fromMessages([
  ['system', SYSTEM_PROMPT],
  new MessagesPlaceholder('chat_history'),
  ['human', '{input}'],
  new MessagesPlaceholder('agent_scratchpad'),
]);

const agent = createToolCallingAgent({ llm, tools, prompt });

export const agentExecutor = new AgentExecutor({
  agent,
  tools,
  maxIterations: 5,
  returnIntermediateSteps: false,
});

// In-memory session store: sessionId → LangChain message array
const sessions = new Map();

export function getHistory(sessionId) {
  return sessions.get(sessionId) ?? [];
}

export function appendToHistory(sessionId, humanMsg, aiMsg) {
  const history = sessions.get(sessionId) ?? [];
  history.push(new HumanMessage(humanMsg));
  history.push(new AIMessage(aiMsg));
  // Keep last 20 turns (40 messages) to avoid token limits
  if (history.length > 40) history.splice(0, history.length - 40);
  sessions.set(sessionId, history);
}

export function clearSession(sessionId) {
  sessions.delete(sessionId);
}
