import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const callbackRequests = [];

export const callDealershipTool = tool(
  async ({ name, phone, reason }) => {
    callbackRequests.push({ name, phone, reason, requestedAt: new Date() });

    console.log('[callDealership] Callback requested:', { name, phone, reason });

    return JSON.stringify({
      success: true,
      message: `Got it, ${name}! We'll call you at ${phone} within 1 hour regarding: "${reason}". Our team is standing by Mon–Sat 9AM–7PM.`,
    });
  },
  {
    name: 'call_dealership',
    description: "Log a callback request when a customer wants the dealership to call them. Use when customer says 'call me', 'have someone contact me', or similar.",
    schema: z.object({
      name: z.string().describe("Customer's full name"),
      phone: z.string().describe("Customer's phone number to call back"),
      reason: z.string().describe("Brief reason for the callback (e.g. 'interested in 2024 F-150', 'financing questions')"),
    }),
  }
);

export function getCallbackRequests() {
  return callbackRequests;
}
