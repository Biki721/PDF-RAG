"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Doc {
  pageContent?: string;
  metadata?: {
    loc?: {
      pageNumber?: number;
    };
    source?: string;
  };
}

interface IMessage {
  role: "assistant" | "user";
  content?: string;
  documents?: Doc[];
}

const ChatComponent: React.FC = () => {
  const [message, setMessage] = React.useState<string>("");
  const [messages, setMessages] = React.useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isStreaming, setIsStreaming] = React.useState<boolean>(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const typewriterTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Typewriter effect function
  const typewriterEffect = (text: string, documents?: Doc[]) => {
    setIsStreaming(true);

    // Add empty assistant message first
    setMessages((prev) => [...prev, { role: "assistant", content: "", documents: [] }]);

    let index = 0;
    const timer = setInterval(() => {
      const newText = text.slice(0, index + 1);
      index++;

      if (index >= text.length) {
        clearInterval(timer);
        setIsStreaming(false);
        // Update with final content and documents
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: text,
            documents: documents || [],
          };
          return updated;
        });
      } else {
        // Update only content during streaming
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: newText,
            documents: [],
          };
          return updated;
        });
      }
    }, 10);
  };

  const handleSendChatMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage("");
    setIsLoading(true);
    
    // Add user message first
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const res = await fetch(
        `http://localhost:8000/chat?message=${encodeURIComponent(userMessage)}`
      );
      const data = await res.json();
      console.log({ data });

      // Start typewriter effect instead of directly adding to messages
      setIsLoading(false);
      typewriterEffect(data?.message || "No response received.", data?.docs);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
      typewriterEffect("Sorry, I encountered an error. Please try again.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-900">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] lg:max-w-[70%] xl:max-w-[60%] rounded-lg px-4 py-2 ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-white"
              }`}
            >
              <div className="markdown-content text-white">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Custom styling for markdown elements
                    h1: ({ children }) => (
                      <h1 className="text-xl font-bold mb-2 text-white">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-semibold mb-2 text-white">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-md font-medium mb-1 text-white">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-2 text-white leading-relaxed">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-2 text-white">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-2 text-white">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="mb-1 text-white">{children}</li>
                    ),
                    code: ({ children, className }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="bg-gray-800 px-1 py-0.5 rounded text-sm text-gray-200">
                          {children}
                        </code>
                      ) : (
                        <code className="block bg-gray-800 p-2 rounded text-sm text-gray-200 overflow-x-auto">
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => (
                      <pre className="bg-gray-800 p-3 rounded mb-2 overflow-x-auto">
                        {children}
                      </pre>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-gray-500 pl-4 italic mb-2 text-gray-300">
                        {children}
                      </blockquote>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-white">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-white">{children}</em>
                    ),
                    a: ({ children, href }) => (
                      <a
                        href={href}
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {msg.content || ""}
                </ReactMarkdown>
              </div>

              {/* Document References */}
              {msg.documents && msg.documents.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <p className="text-xs text-gray-300 mb-2 font-medium">
                    📄 References:
                  </p>
                  <div className="space-y-2">
                    {msg.documents.map((doc, docIdx) => (
                      <details key={docIdx} className="group">
                        <summary className="cursor-pointer text-xs text-blue-300 hover:text-blue-100 font-medium">
                          📖 Page {doc.metadata?.loc?.pageNumber ?? "?"}
                        </summary>
                        <div className="mt-2 p-3 bg-gray-800 rounded-lg text-xs">
                          <pre className="whitespace-pre-wrap text-gray-300 font-mono text-xs leading-relaxed">
                            {doc.pageContent}
                          </pre>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-white rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Sticky Bottom */}
      <div className="bg-gray-800 border-t border-gray-700 p-4 w-full">
        <div className="flex items-center gap-2 w-full">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
            disabled={!message.trim() || isLoading}
            style={{
              backgroundColor: !message.trim() ? "gray" : "blue",
              cursor: !message.trim() ? "not-allowed" : "pointer",
              color: "white",
            }}
            onClick={handleSendChatMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
