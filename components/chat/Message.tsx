'use client';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export default function Message({ role, content, timestamp }: MessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex items-end gap-2 mb-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
         style={{ animation: 'alexFadeIn 0.2s ease-out' }}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-[#B22222] flex items-center justify-center text-white text-xs font-black shrink-0 mb-0.5">
          A
        </div>
      )}
      <div className={`max-w-[78%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-[#B22222] text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
        }`}>
          {content}
        </div>
        <span className="text-[10px] text-gray-400 px-1">
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
