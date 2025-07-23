// pages/index.tsx (simplified UI)
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">AI Legal Assistant</h1>
      <input type="file" accept=".pdf" className="mb-2" />
      <textarea className="w-full p-2 border" placeholder="Ask about this contract..." />
      <button className="bg-blue-500 text-white px-4 py-2 rounded mt-2">Analyze</button>
      <div className="mt-4 p-2 bg-white border rounded w-full">AI Response Here</div>
    </div>
  )
}
