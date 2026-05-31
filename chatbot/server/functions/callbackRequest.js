const FASTAPI = process.env.FASTAPI_URL || 'http://localhost:8000';

export const definition = {
  type: 'function',
  function: {
    name: 'callback_request',
    description: "Submit a callback request to the dealership. Use when customer wants the team to call them.",
    parameters: {
      type: 'object',
      properties: {
        name:   { type: 'string', description: "Customer's full name" },
        phone:  { type: 'string', description: "Customer's phone number" },
        email:  { type: 'string', description: "Customer's email address" },
        reason: { type: 'string', description: "Reason for the callback" },
      },
      required: ['name', 'phone', 'email', 'reason'],
    },
  },
};

export async function handler({ name, phone, email, reason }) {
  const res = await fetch(`${FASTAPI}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      email,
      phone,
      subject: 'Callback Request',
      message: `Callback requested by ${name} at ${phone}.\nReason: ${reason}`,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to submit callback request');
  }

  return {
    success: true,
    message: `Got it, ${name}! One of our team members will call you at ${phone} within 1 hour regarding: "${reason}". We're available Mon–Sat 9AM–7PM.`,
  };
}
