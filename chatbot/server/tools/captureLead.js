import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const leads = [];

export const captureLeadTool = tool(
  async ({ name, phone, email, interest }) => {
    leads.push({ name, phone, email, interest, capturedAt: new Date() });

    console.log('[captureLead] New lead:', { name, phone, email, interest });

    return JSON.stringify({
      success: true,
      message: `Got it! Thanks, ${name}. Our team will follow up at ${email} or ${phone} shortly regarding your interest in ${interest}. We typically respond within 30 minutes during business hours.`,
    });
  },
  {
    name: 'capture_lead',
    description: "Save a customer's contact information and interest when they want to be followed up with or when they've expressed interest in a vehicle.",
    schema: z.object({
      name: z.string().describe("Customer's full name"),
      phone: z.string().describe("Customer's phone number"),
      email: z.string().describe("Customer's email address"),
      interest: z.string().describe("What the customer is interested in (e.g. '2024 Toyota Camry', 'electric vehicles', 'financing options')"),
    }),
  }
);

export function getLeads() {
  return leads;
}
