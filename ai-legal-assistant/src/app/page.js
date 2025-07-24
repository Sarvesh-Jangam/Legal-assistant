'use client'
import { useState } from "react";

export default function Home() {
  const [fileName, setFileName] = useState("");
  const [question, setQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setAiResponse("");

    // Replace this with actual API call
    setTimeout(() => {
      setAiResponse("This is a sample AI response highlighting legal risks, obligations, and compliance issues.");
      setLoading(false);
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">🧠 AI Legal Assistant</h1>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Upload Contract (PDF)</label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
          />
          {fileName && (
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-sm text-green-700">📄 {fileName} uploaded</p>
              <button
                type="button"
                onClick={() => setFileName("")}
                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center"
                aria-label="Remove file"
              >

                <button className="relative block group ">
                  <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 24 24">
<path fill="red d="M 10.806641 2 C 10.289641 2 9.7956875 2.2043125 9.4296875 2.5703125 L 9 3 L 4 3 A 1.0001 1.0001 0 1 0 4 5 L 20 5 A 1.0001 1.0001 0 1 0 20 3 L 15 3 L 14.570312 2.5703125 C 14.205312 2.2043125 13.710359 2 13.193359 2 L 10.806641 2 z M 4.3652344 7 L 5.8925781 20.263672 C 6.0245781 21.253672 6.877 22 7.875 22 L 16.123047 22 C 17.121047 22 17.974422 21.254859 18.107422 20.255859 L 19.634766 7 L 4.3652344 7 z"></path>
</svg>
                </button>


              </button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Ask a Question</label>
          <textarea
            rows={4}
            placeholder="e.g., What are the risks for the vendor?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={loading || !fileName || !question}
            className={`px-6 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition ${(loading || !fileName || !question) && "opacity-50 cursor-not-allowed"
              }`}
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {aiResponse && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">💬 AI Response</h2>
            <p className="text-gray-700 whitespace-pre-line">{aiResponse}</p>
          </div>
        )}
      </div>
    </main>
  );
}

