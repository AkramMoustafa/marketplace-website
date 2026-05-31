import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';

// In-memory store (replace with DB in production)
const appointments = [];

export const scheduleTestDriveTool = tool(
  async ({ name, phone, email, car_model, date, time }) => {
    const confirmationNumber = `TD-${uuid().slice(0, 8).toUpperCase()}`;
    appointments.push({ confirmationNumber, name, phone, email, car_model, date, time, createdAt: new Date() });

    console.log('[scheduleTestDrive]', { confirmationNumber, name, car_model, date, time });

    return JSON.stringify({
      success: true,
      confirmationNumber,
      message: `Test drive scheduled! Confirmation #${confirmationNumber}. ${name} will test drive the ${car_model} on ${date} at ${time}. A confirmation will be sent to ${email}.`,
    });
  },
  {
    name: 'schedule_test_drive',
    description: 'Schedule a test drive appointment for a customer. Call this when a customer wants to test drive a vehicle.',
    schema: z.object({
      name: z.string().describe("Customer's full name"),
      phone: z.string().describe("Customer's phone number"),
      email: z.string().describe("Customer's email address"),
      car_model: z.string().describe('Car make and model the customer wants to test drive (e.g. "2024 Toyota Camry")'),
      date: z.string().describe('Preferred date in YYYY-MM-DD format'),
      time: z.string().describe('Preferred time in HH:MM format (24h)'),
    }),
  }
);

export function getAppointments() {
  return appointments;
}
