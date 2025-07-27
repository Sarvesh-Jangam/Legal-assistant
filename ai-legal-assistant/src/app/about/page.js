import Navbar from "../components/Navbar";

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-2xl">
          <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">About AI Legal Assistant</h1>
          <p className="mb-4 text-gray-700 text-lg text-center">
            AI Legal Assistant is a modern web application designed to help users analyze legal documents, highlight risks, and answer legal questions using advanced AI technology.
          </p>
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Features</h2>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Upload and analyze contracts (PDF)</li>
            <li>Ask questions about legal documents</li>
            <li>View previous chats and responses</li>
            <li>Secure authentication with Clerk</li>
          </ul>
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Team</h2>
          <p className="text-gray-700 mb-2">Developed by Sarvesh-Jangam and contributors.</p>
          <p className="text-gray-700">For more information, visit our <a href="https://github.com/Sarvesh-Jangam/Legal-assistant" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">GitHub repository</a>.</p>
        </div>
      </main>
    </>
  );
}
