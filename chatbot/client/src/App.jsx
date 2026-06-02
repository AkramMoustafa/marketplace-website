import ChatWidget from './components/ChatWidget.jsx';

export default function App() {
  return (
    <>
      {/* Demo page background */}
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
        <div className="text-center max-w-lg">
          <div className="inline-block px-3 py-1 bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-widest rounded-full border border-orange-500/20 mb-6">
            Demo Page
          </div>
          <h1 className="text-4xl font-black text-white mb-3">
            NOVA Motors
          </h1>
          <p className="text-slate-400 text-lg mb-2">AI-Powered Dealership Assistant</p>
          <p className="text-slate-500 text-sm">
            Click the chat button in the bottom-right corner to talk to Alex,<br />
            your virtual car-buying assistant.
          </p>
        </div>
      </div>

      {/* Floating chat widget — this is what you embed */}
      <ChatWidget apiUrl="" />
    </>
  );
}
