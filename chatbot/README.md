# Alex — AI Dealership Chatbot

Floating chat widget powered by **LangChain + Groq (llama3-70b-8192)**.  
Alex can schedule test drives, check inventory, estimate financing, capture leads, and more.

---

## Stack

| Layer    | Tech                                  |
|----------|---------------------------------------|
| AI       | LangChain + Groq `llama3-70b-8192`   |
| Backend  | Node.js + Express                     |
| Frontend | React 18 + Tailwind CSS + Vite        |

---

## Setup

### 1. Get a Groq API key

Sign up at [console.groq.com](https://console.groq.com) — free tier available.

### 2. Backend

```bash
cd chatbot/server
npm install

# Create .env from example
cp .env.example .env
# → Add your GROQ_API_KEY to .env

npm run dev       # dev (nodemon)
# or
npm start         # production
```

Server runs on **http://localhost:3001**.

### 3. Frontend

```bash
cd chatbot/client
npm install

# Create .env from example
cp .env.example .env
# → VITE_API_URL=http://localhost:3001

npm run dev       # dev server on :5173
```

Open **http://localhost:5173** to see the demo page with the chat widget.

---

## API Endpoints

| Method | Path                      | Description                    |
|--------|---------------------------|--------------------------------|
| GET    | `/health`                 | Server health check            |
| GET    | `/api/welcome`            | Returns Alex's greeting        |
| POST   | `/api/chat`               | Send a message, get a response |
| DELETE | `/api/session/:sessionId` | Clear conversation history     |

### POST `/api/chat`

**Request:**
```json
{ "message": "I want to test drive a Camry", "sessionId": "uuid-here" }
```

**Response:**
```json
{ "response": "Great choice! ...", "sessionId": "uuid-here" }
```

---

## Tools

| Tool                   | What it does                                        |
|------------------------|-----------------------------------------------------|
| `schedule_test_drive`  | Books a test drive, returns confirmation number     |
| `inquire_about_car`    | Returns mock price, features, availability          |
| `check_inventory`      | Lists vehicles by type (SUV / sedan / truck / EV)   |
| `call_dealership`      | Logs a callback request                             |
| `get_financing_estimate` | Calculates monthly payments across loan terms     |
| `capture_lead`         | Saves customer contact info                         |

---

## Embed on Any Website

### Option A — iframe (simplest)

```html
<iframe
  src="https://your-chatbot-client.com"
  style="position:fixed;bottom:0;right:0;width:400px;height:650px;border:none;z-index:9999"
></iframe>
```

### Option B — Script tag (self-contained bundle)

1. Build the embed bundle:
   ```bash
   cd chatbot/client
   npm run build:embed
   # → dist/alex-chatbot.iife.js
   ```

2. Host `alex-chatbot.iife.js` on a CDN or your server.

3. Add one line to any HTML page:
   ```html
   <script
     src="https://your-cdn.com/alex-chatbot.iife.js"
     data-api-url="https://your-api-server.com"
   ></script>
   ```

The widget mounts itself as a floating button in the bottom-right corner — no other changes needed.

---

## Environment Variables

### Server (`chatbot/server/.env`)

| Variable     | Required | Description                  |
|--------------|----------|------------------------------|
| `GROQ_API_KEY` | Yes    | Your Groq API key            |
| `PORT`       | No       | Server port (default `3001`) |
| `CLIENT_URL` | No       | Frontend URL for CORS        |

### Client (`chatbot/client/.env`)

| Variable       | Required | Description                         |
|----------------|----------|-------------------------------------|
| `VITE_API_URL` | No       | Backend URL (default `""` = proxy)  |
