export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-[#B22222] flex items-center justify-center text-white text-xs font-black shrink-0">
        A
      </div>
      <div className="bg-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce3"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
