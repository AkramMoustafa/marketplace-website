import OpenAI from 'openai';
import { definition as scheduleTestDriveDef, handler as scheduleTestDriveHandler } from './functions/scheduleTestDrive.js';
import { definition as inquireAboutCarDef,  handler as inquireAboutCarHandler  } from './functions/inquireAboutCar.js';
import { definition as checkInventoryDef,   handler as checkInventoryHandler   } from './functions/checkInventory.js';
import { definition as callbackRequestDef,  handler as callbackRequestHandler  } from './functions/callbackRequest.js';
import { definition as financingEstimateDef,handler as financingEstimateHandler} from './functions/financingEstimate.js';
import { definition as captureLeadDef,      handler as captureLeadHandler      } from './functions/captureLead.js';

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const tools = [
  scheduleTestDriveDef,
  inquireAboutCarDef,
  checkInventoryDef,
  callbackRequestDef,
  financingEstimateDef,
  captureLeadDef,
];

const handlers = {
  schedule_test_drive:  scheduleTestDriveHandler,
  inquire_about_car:    inquireAboutCarHandler,
  check_inventory:      checkInventoryHandler,
  callback_request:     callbackRequestHandler,
  financing_estimate:   financingEstimateHandler,
  capture_lead:         captureLeadHandler,
};

const SYSTEM_PROMPT = `You are Alex, a friendly and professional virtual assistant for NOVA Motors car dealership in Detroit, MI.

Your role:
- Help customers browse real inventory and get vehicle details
- Schedule test drives (saved directly to our system)
- Provide financing payment estimates
- Log callback requests and capture leads (saved to our CRM)
- Keep responses concise — 2-3 sentences unless presenting inventory or estimates

Rules:
- Always use the tools to get real data — never invent prices, availability, or vehicle details
- Collect all required fields naturally through conversation before calling a tool
- If a customer asks about a specific vehicle, call inquire_about_car first
- When browsing inventory, call check_inventory with the appropriate type
- Confirm details with the customer before booking appointments
- If the backend is unavailable, apologize and offer a callback instead`;

// In-memory session store: sessionId → messages array
const sessions = new Map();

export function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, [{ role: 'system', content: SYSTEM_PROMPT }]);
  }
  return sessions.get(sessionId);
}

export function clearSession(sessionId) {
  sessions.delete(sessionId);
}

export async function chat(sessionId, userMessage) {
  const messages = getSession(sessionId);
  messages.push({ role: 'user', content: userMessage });

  // Keep history bounded (system + last 30 messages)
  if (messages.length > 32) {
    messages.splice(1, messages.length - 32);
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    tools,
    tool_choice: 'auto',
  });

  const msg = response.choices[0].message;
  messages.push(msg);

  // Handle tool calls
  if (msg.tool_calls?.length) {
    for (const tc of msg.tool_calls) {
      let result;
      try {
        const args = JSON.parse(tc.function.arguments);
        result = await handlers[tc.function.name]?.(args) ?? { error: 'Unknown function' };
      } catch (err) {
        console.error(`[tool error] ${tc.function.name}:`, err.message);
        result = { error: err.message };
      }
      messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
    }

    // Second pass to get natural-language response after tool results
    const followUp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools,
      tool_choice: 'auto',
    });

    const finalMsg = followUp.choices[0].message;
    messages.push(finalMsg);
    return finalMsg.content;
  }

  return msg.content;
}
