import AnalysisForm from "./components/AnalysisForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto py-12">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          LLM 텍스트 분석
        </h1>
        <AnalysisForm />
      </main>
    </div>
  );
}
