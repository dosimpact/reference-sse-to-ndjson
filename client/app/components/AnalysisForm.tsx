"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";

type MessageType = "info" | "error" | "progress";
type AnalysisPhase = "준비" | "처리" | "분석" | "완료";

interface UIMessage {
  text: string;
  type: MessageType;
  timestamp: number;
  phase?: AnalysisPhase;
  code?: string;
}

interface AnalysisData {
  message?: string;
  error?: string;
  code?: string;
  phase?: AnalysisPhase;
  timestamp?: string;
}

const MAX_TEXT_LENGTH = 1000;
const MIN_TEXT_LENGTH = 10;

export default function AnalysisForm() {
  const { data, input, handleInputChange, handleSubmit, status, stop } =
    useChat({
      api: "http://localhost:3001/analysis",
      body: {
        text: "HelloHelloHelloHelloHello",
      },
    });

  return (
    <div className="p-4 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md flex flex-col h-full">
      <div className="flex-grow overflow-y-auto space-y-2 mb-4">
        {data &&
          (data as AnalysisData[]).map((message, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg ${
                message.phase === "완료"
                  ? "bg-blue-100 dark:bg-blue-900 text-right"
                  : "bg-gray-100 dark:bg-gray-700 text-left"
              }`}
            >
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {message.timestamp}
                </p>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    message.phase === "완료"
                      ? "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200"
                      : "bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200"
                  }`}
                >
                  {message.phase}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {message.message}
              </p>
            </div>
          ))}
      </div>

      {(status === "submitted" || status === "streaming") && (
        <div className="flex items-center space-x-2 mb-4">
          {status === "submitted" && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          )}
          <button
            type="button"
            onClick={() => stop()}
            className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-800"
          >
            Stop
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          name="prompt"
          value={input}
          onChange={handleInputChange}
          disabled={status !== "ready"}
          className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="메시지를 입력하세요..."
        />
        <button
          type="submit"
          className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
