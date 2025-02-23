"use client";

import AnalysisForm from "./components/AnalysisForm";
import { useChat } from "@ai-sdk/react";

export default function Home() {
  const { data, input, handleInputChange, handleSubmit, status, stop } =
    useChat({
      api: "http://localhost:3001/analysis",
      body: {
        text: "HelloHelloHelloHelloHello",
      },
    });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto py-12">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          LLM 텍스트 분석
        </h1>
        <AnalysisForm />
      </main>

      {/* <>
        {data &&
          data?.map((message) => (
            <div key={message?.timestamp}>
              {message?.message}
              {message?.timestamp}
              {message?.phase}
            </div>
          ))}

        {(status === "submitted" || status === "streaming") && (
          <div>
            {status === "submitted" && <div>Loading...</div>}
            <button type="button" onClick={() => stop()}>
              Stop
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            name="prompt"
            value={input}
            onChange={handleInputChange}
            disabled={status !== "ready"}
          />
          <button type="submit">Submit</button>
        </form>
      </> */}
    </div>
  );
}
