const FASTAPI = process.env.FASTAPI_URL || 'http://localhost:8000';

export const definition = {
  type: 'function',
  function: {
    name: 'schedule_test_drive',
    description: 'Book a test drive appointment in the dealership system. Collect all required info before calling.',
    parameters: {
      type: 'object',
      properties: {
        name:      { type: 'string', description: "Customer's full name" },
        phone:     { type: 'string', description: "Customer's phone number" },
        email:     { type: 'string', description: "Customer's email address" },
        car_model: { type: 'string', description: 'Car they want to test drive (e.g. "2024 Toyota Camry")' },
        date:      { type: 'string', description: 'Date as YYYY-MM-DD' },
        time:      { type: 'string', description: 'Time as HH:MM (24h)' },
      },
      required: ['name', 'phone', 'email', 'car_model', 'date', 'time'],
    },
  },
};

export async function handler({ name, phone, email, car_model, date, time }) {
  const appointment_date = `${date}T${time}:00`;
  const notes = `Customer: ${name} | Email: ${email} | Vehicle: ${car_model}`;

  const res = await fetch(`${FASTAPI}/api/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ service_type: 'test_drive', appointment_date, phone, notes }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to book appointment');
  }

  const appt = await res.json();
  return {
    success: true,
    appointmentId: appt.id,
    message: `Test drive booked for ${name} — ${car_model} on ${date} at ${time}. Confirmation ID: ${appt.id.slice(0, 8).toUpperCase()}. We'll send details to ${email}.`,
  };
}
