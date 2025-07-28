'use client'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import Navbar from "./components/Navbar";
import SignaturePadComponent from "./components/SignaturePad";

export default function Home() {
  const [fileName, setFileName] = useState("");
  const [question, setQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedContractText, setUploadedContractText] = useState("");

  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { signOut } = useClerk();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/login");
    }
  }, [isLoaded, isSignedIn, router]);

  const handleFileChange = async (e) => {
    if (e.target.files?.[0]) {
      setFileName(e.target.files[0].name);

      const pdfjsLib = await import("pdfjs-dist/build/pdf");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async function () {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(" ") + "\n";
        }
        setUploadedContractText(text);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setAiResponse("");
    try {
      const answer = await askLegalQuestion(question, uploadedContractText);
      setAiResponse(answer);
    } catch (err) {
      setAiResponse("There was an error processing your request.");
    }
    setLoading(false);
  };

  async function askLegalQuestion(prompt, contractText) {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, contractText })
    });

    const data = await res.json();
    return data.response;
  }

  if (!isLoaded || !isSignedIn) return null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-100 p-6 flex gap-6">
        
        {/* Sidebar */}
        <aside className="w-72 bg-white shadow-xl shadow-blue-100 rounded-3xl p-6 flex flex-col border border-blue-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">💬 Previous Chats</h2>
          <ul className="space-y-3 overflow-y-auto flex-1">
            {["What are the risks for the vendor?", "List compliance issues in section 4", "Summarize obligations for both parties"].map((item, i) => (
              <li
                key={i}
                className="p-3 rounded-xl bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 transition shadow-sm cursor-pointer text-sm text-gray-800"
              >
                {item}
              </li>
            ))}
          </ul>
          <button className="mt-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:brightness-110 transition shadow-md">
            + New Chat
          </button>
        </aside>

        {/* Main Content */}
        <section className="flex-1">
          <div className="max-w-3xl mx-auto bg-white shadow-2xl rounded-3xl p-10 space-y-10 border border-gray-100">
            <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-purple-600 drop-shadow-md">
              ⚖️ AI Legal Assistant
            </h1>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Contract (PDF)</label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="w-full text-sm file:bg-blue-200 file:text-blue-900 file:font-semibold file:border-0 file:rounded-lg file:px-4 file:py-2 hover:file:brightness-110 cursor-pointer transition shadow"
              />
              {fileName && (
                <div className="mt-2 flex items-center gap-3">
                  <p className="text-green-700 text-sm font-medium">📄 {fileName} uploaded</p>
                  <button
                    onClick={() => setFileName("")}
                    className="text-red-600 hover:text-red-800 transition text-sm"
                    aria-label="Remove file"
                  >
                    ❌
                  </button>
                </div>
              )}
            </div>

            {/* Question Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ask a Question</label>
              <textarea
                rows={4}
                placeholder="e.g., What are the risks for the vendor?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full p-4 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 focus:outline-none resize-none bg-gradient-to-br from-white to-blue-50 shadow-inner"
              />
            </div>

            {/* Analyze Button */}
            <div className="flex justify-end">
              <button
                onClick={handleAnalyze}
                disabled={loading || !fileName || !question}
                className={`px-6 py-3 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg transition ${
                  (loading || !fileName || !question) && "opacity-50 cursor-not-allowed"
                }`}
              >
                {loading ? "Analyzing..." : "Analyze"}
              </button>
            </div>

            {/* AI Response */}
            {aiResponse && (
              <div className="bg-white border border-blue-100 p-5 rounded-xl shadow-lg">
                <h2 className="text-lg font-semibold text-blue-800 mb-2">💡 AI Response</h2>
                <p className="text-gray-800 whitespace-pre-line leading-relaxed">{aiResponse}</p>
              </div>
            )}
          </div>
             <SignaturePadComponent/>
        </section>
      </main>
    </>
  );
}
