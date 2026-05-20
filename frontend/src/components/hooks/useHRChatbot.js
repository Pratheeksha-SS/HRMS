// ============================================================
// FILE: frontend/src/components/hooks/useHRChatbot.js
// REPLACE existing file with this
// ============================================================

import { useState, useCallback } from "react";
import axios from "../../utils/axiosConfig";  // your existing axios instance

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello! 👋 I'm your HR Assistant. I can help you with leave balances, " +
    "upcoming holidays, company policies, and more. What would you like to know?",
  timestamp: new Date(),
};

export function useHRChatbot() {
  const [messages, setMessages]   = useState([WELCOME_MESSAGE]);
  const [input, setInput]         = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState(null);

  const buildHistory = useCallback((msgs) =>
    msgs
      .filter((m) => m.id !== "welcome")
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content })),
  []);

  const sendMessage = useCallback(
    async (queryOverride) => {
      const query = (queryOverride ?? input).trim();
      if (!query || isLoading) return;

      setError(null);
      setInput("");
      setIsLoading(true);

      const userMsg = {
        id: `u_${Date.now()}`,
        role: "user",
        content: query,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);

      try {
        // ✅ URL is /api/chatbot/ 
        // axiosConfig baseURL should be http://localhost:8000
        // hrms/urls.py should have path("chatbot/", ChatbotView...)
        const res = await axios.post("/api/chatbot/", {
          query,
          history: buildHistory([...messages, userMsg]),
        });

        const botMsg = {
          id: `b_${Date.now()}`,
          role: "assistant",
          content: res.data.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);

      } catch (err) {
        console.error("Chatbot API Error:", {
          status: err.response?.status,
          statusText: err.response?.statusText,
          message: err.message,
          url: err.config?.url,
        });

        const errMsg =
          err.response?.status === 401
            ? "Session expired. Please log in again."
            : err.response?.status === 404
            ? "Chatbot endpoint not found. Check that hrms/urls.py has: path('chatbot/', ChatbotView.as_view())"
            : err.response?.data?.error || err.message || "Something went wrong.";

        setError(errMsg);
        setMessages((prev) => [
          ...prev,
          {
            id: `b_err_${Date.now()}`,
            role: "assistant",
            content: "⚠️ " + errMsg,
            timestamp: new Date(),
            isError: true,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, buildHistory]
  );

  const clearChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setError(null);
    setInput("");
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  return {
    messages,
    input,
    setInput,
    isLoading,
    error,
    sendMessage,
    clearChat,
    handleKeyDown,
  };
}
