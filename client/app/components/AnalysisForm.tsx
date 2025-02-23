"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat, Message as AIMessage } from "ai/react";

type MessageType = "info" | "error" | "progress";
type AnalysisPhase = "준비" | "처리" | "분석" | "완료";

interface Message {
  text: string;
  type: MessageType;
  timestamp: number;
  phase?: AnalysisPhase;
  code?: string;
}

interface StreamData extends AIMessage {
  message?: string;
  error?: string;
  code?: string;
  phase?: AnalysisPhase;
  timestamp?: string;
}

const MAX_TEXT_LENGTH = 1000;
const MIN_TEXT_LENGTH = 10;

const PHASE_KEYWORDS = {
  시작합니다: "준비",
  처리: "처리",
  분석: "분석",
  완료: "완료",
} as const;

const ERROR_MESSAGES = {
  SERVER_OVERLOAD: "서버가 과부하 상태입니다. 잠시 후 다시 시도해주세요.",
  MODEL_LOAD_FAILED: "분석 모델 로딩에 실패했습니다. 관리자에게 문의해주세요.",
  OUT_OF_MEMORY: "서버 메모리가 부족합니다. 잠시 후 다시 시도해주세요.",
  NETWORK_UNSTABLE: "네트워크 연결이 불안정합니다. 인터넷 연결을 확인해주세요.",
  MODEL_EXCEPTION: "분석 모델에서 오류가 발생했습니다. 다시 시도해주세요.",
  UNEXPECTED_ERROR:
    "예기치 않은 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  CONNECTION_ERROR: "서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.",
  STREAM_ERROR: "데이터 스트림 처리 중 오류가 발생했습니다.",
} as const;

type ErrorCode = keyof typeof ERROR_MESSAGES;

export default function AnalysisForm() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<AnalysisPhase>("준비");
  const [canSave, setCanSave] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const { data, setData } = useChat<StreamData>({
    api: "http://localhost:3001/analysis",
    onResponse: (response: Response) => {
      if (!response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            text: `분석 요청에 실패했습니다. 서버 응답: ${response.status}`,
            type: "error",
            timestamp: Date.now(),
            phase: currentPhase,
          },
        ]);
        setIsLoading(false);
      }
    },
    onFinish: () => {
      setIsLoading(false);
      setCanSave(true);
      setProgress(100);
    },
    onError: (error: Error) => {
      setMessages((prev) => [
        ...prev,
        {
          text: error.message,
          type: "error",
          timestamp: Date.now(),
          phase: currentPhase,
        },
      ]);
      setIsLoading(false);
      setProgress(0);
    },
  });

  useEffect(() => {
    if (data) {
      const lastData = data[data.length - 1];
      if (lastData) {
        const phase = lastData.phase || currentPhase;
        setCurrentPhase(phase);

        if (lastData.error) {
          setMessages((prev) => [
            ...prev,
            {
              text: lastData.error,
              type: "error",
              timestamp: Date.now(),
              phase,
              code: lastData.code,
            },
          ]);
          setCanSave(false);
        } else if (lastData.message) {
          setMessages((prev) => [
            ...prev,
            {
              text: lastData.message,
              type: "info",
              timestamp: Date.now(),
              phase,
            },
          ]);
        }

        // 진행률 업데이트
        const expectedMessages = 6;
        const currentProgress = Math.min(
          Math.round((data.length / expectedMessages) * 100),
          100
        );
        setProgress(currentProgress);
      }
    }
  }, [data, currentPhase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateText()) return;

      setIsLoading(true);
      setProgress(0);
      setCanSave(false);
      setCurrentPhase("준비");
      setMessages([
        {
          text: "분석을 시작합니다...",
          type: "info",
          timestamp: Date.now(),
          phase: "준비",
        },
      ]);
      setData(undefined);

      try {
        const response = await fetch("http://localhost:3001/analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error(
            `분석 요청에 실패했습니다. 서버 응답: ${response.status}`
          );
        }

        if (!response.body) {
          throw new Error("응답 데이터가 없습니다.");
        }
      } catch (error) {
        console.error("Error:", error);
        setMessages((prev) => [
          ...prev,
          {
            text:
              error instanceof Error
                ? error.message
                : "알 수 없는 오류가 발생했습니다.",
            type: "error",
            timestamp: Date.now(),
            phase: currentPhase,
          },
        ]);
        setProgress(0);
        setCanSave(false);
        setIsLoading(false);
      }
    },
    [text, currentPhase, setData]
  );

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter로 분석 시작
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (!isLoading && text.length >= MIN_TEXT_LENGTH) {
          e.preventDefault();
          formRef.current?.requestSubmit();
        }
      }
      // Ctrl/Cmd + S로 결과 저장
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (canSave) {
          handleSaveResults();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [text, isLoading, canSave, handleSubmit]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (newText.length <= MAX_TEXT_LENGTH) {
      setText(newText);
      setProgress(0);
      setCanSave(false);
    }
  };

  const validateText = () => {
    if (text.length < MIN_TEXT_LENGTH) {
      setMessages((prev) => [
        ...prev,
        {
          text: `텍스트는 최소 ${MIN_TEXT_LENGTH}자 이상이어야 합니다.`,
          type: "error",
          timestamp: Date.now(),
          phase: currentPhase,
        },
      ]);
      return false;
    }

    if (text.length > MAX_TEXT_LENGTH) {
      setMessages((prev) => [
        ...prev,
        {
          text: `텍스트는 최대 ${MAX_TEXT_LENGTH}자를 초과할 수 없습니다.`,
          type: "error",
          timestamp: Date.now(),
          phase: currentPhase,
        },
      ]);
      return false;
    }

    return true;
  };

  const handleSaveResults = () => {
    if (messages.length === 0) return;

    const analysisResults = {
      text,
      messages: messages.map((m) => ({
        text: m.text,
        type: m.type,
        timestamp: new Date(m.timestamp).toISOString(),
      })),
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(analysisResults, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analysis-results-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setMessages((prev) => [
      ...prev,
      {
        text: "분석 결과가 저장되었습니다.",
        type: "info",
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-8 text-gray-800 dark:text-white">
        LLM 텍스트 분석
      </h1>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label
              htmlFor="analysis-text"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              분석할 텍스트
            </label>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Ctrl/Cmd + Enter: 분석 시작
              </span>
              <span
                className={`text-sm ${
                  text.length >= MAX_TEXT_LENGTH
                    ? "text-red-500 dark:text-red-400"
                    : text.length < MIN_TEXT_LENGTH && text.length > 0
                    ? "text-yellow-500 dark:text-yellow-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {text.length} / {MAX_TEXT_LENGTH}
              </span>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            id="analysis-text"
            value={text}
            onChange={handleTextChange}
            className={`w-full h-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors ${
              text.length >= MAX_TEXT_LENGTH
                ? "border-red-300 dark:border-red-600"
                : text.length < MIN_TEXT_LENGTH && text.length > 0
                ? "border-yellow-300 dark:border-yellow-600"
                : "border-gray-300 dark:border-gray-600"
            }`}
            placeholder="분석하고 싶은 텍스트를 입력하세요... (최소 10자)"
            disabled={isLoading}
            required
            aria-label="분석할 텍스트 입력"
            aria-describedby="text-description"
          />
          <div id="text-description" className="sr-only">
            분석할 텍스트를 입력하세요. 최소 10자, 최대 1000자까지 입력
            가능합니다. Ctrl 또는 Command와 Enter 키를 함께 누르면 분석을 시작할
            수 있습니다.
          </div>
          {text.length > 0 && text.length < MIN_TEXT_LENGTH && (
            <p
              className="mt-1 text-sm text-yellow-500 dark:text-yellow-400"
              role="alert"
            >
              텍스트가 너무 짧습니다. 최소 {MIN_TEXT_LENGTH}자 이상
              입력해주세요.
            </p>
          )}
        </div>

        {isLoading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                현재 단계: {currentPhase}
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                {progress}%
              </span>
            </div>
            <div
              className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isLoading || text.length < MIN_TEXT_LENGTH}
            className={`flex-1 py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 ${
              isLoading || text.length < MIN_TEXT_LENGTH
                ? "bg-blue-400 cursor-not-allowed opacity-75"
                : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
            }`}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                분석 중... {progress}%
              </span>
            ) : (
              "LLM으로 분석하기"
            )}
          </button>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleSaveResults}
              disabled={!canSave}
              className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                canSave
                  ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
              }`}
              title={
                canSave
                  ? "Ctrl/Cmd + S로 저장"
                  : "분석이 완료되면 저장할 수 있습니다"
              }
              aria-label={
                canSave
                  ? "분석 결과 저장하기"
                  : "분석이 완료되면 저장할 수 있습니다"
              }
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
            </button>
          )}
        </div>
      </form>

      {messages.length > 0 && (
        <div
          className="mt-8 space-y-6"
          role="log"
          aria-label="분석 결과 메시지"
        >
          {Object.entries(
            messages.reduce<Record<AnalysisPhase, Message[]>>(
              (acc, message) => {
                const phase = message.phase || "준비";
                if (!acc[phase]) acc[phase] = [];
                acc[phase].push(message);
                return acc;
              },
              {} as Record<AnalysisPhase, Message[]>
            )
          ).map(([phase, phaseMessages]) => (
            <div key={phase} className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center">
                <span>{phase} 단계</span>
                {phaseMessages.some((m) => m.type === "error") && (
                  <span className="ml-2 text-sm text-red-500 dark:text-red-400 flex items-center">
                    <svg
                      className="h-4 w-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    오류 발생
                  </span>
                )}
              </h2>
              <div className="space-y-3 ml-4">
                {phaseMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg shadow-sm border animate-fade-in ${
                      message.type === "error"
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        : message.type === "progress"
                        ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    }`}
                    role={message.type === "error" ? "alert" : "status"}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {message.type === "error" ? (
                          <svg
                            className="h-5 w-5 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        ) : message.type === "progress" ? (
                          <svg
                            className="h-5 w-5 text-yellow-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-5 w-5 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <p
                          className={`${
                            message.type === "error"
                              ? "text-red-700 dark:text-red-200"
                              : message.type === "progress"
                              ? "text-yellow-700 dark:text-yellow-200"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {message.text}
                        </p>
                        {message.code && (
                          <p className="text-sm mt-1 text-red-500 dark:text-red-400">
                            에러 코드: {message.code}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}
