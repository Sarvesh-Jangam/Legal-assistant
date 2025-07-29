'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import Navbar from "./components/Navbar";
import { configDotenv } from "dotenv";
import Sidebar from "./components/Sidebar";
import { useChatContext } from "./context/userContextProvider";
import { chatService } from "./services/chatService.js";
import SignaturePad from "./components/SignaturePad.js";
import Modal from "./components/Modal.js";

export default function Home() {
  const router = useRouter();
  const { isSignedIn, isLoaded, userId } = useAuth();
  const { signOut } = useClerk();
  const { 
    question, setQuestion,
    aiResponse, setAiResponse,
    fileName, setFileName,
    loading, setLoading,
    handleChatSelect,
    handleNewChat,
    chats, setChats
  } = useChatContext();
  
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [queryMode, setQueryMode] = useState('existing'); // 'existing', 'upload', 'context'

  const handleChatSelection = async (chat) => {
    setSelectedChatId(chat._id);
    setQuestion(chat.title || "");
    setFileName(chat.fileName || "");
    
    // Load messages for this chat
    try {
      const res = await fetch(`/api/messages?chatId=${chat._id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  // Handle new chat button click
  const handleNewChatClick = () => {
    setSelectedChatId(null);
    setQuestion("");
    setFileName("");
    setMessages([]);
    setInputMessage("");
    setAiResponse("");
    handleNewChat && handleNewChat();
  };

  //db connection dont touch this
  useEffect(()=>{
    (async()=>await fetch("/api/db",(req,res)=>{
      
    }))();
  },[])

  // Load chats initially and when user signs in
  useEffect(() => {
    const loadUserChats = async () => {
      if (isSignedIn && userId) {
        const res = await fetch(`/api/chats?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setChats(prevChats => {
            // Only update if the new chats are different
            const newChats = data.chats || [];
            return JSON.stringify(prevChats) !== JSON.stringify(newChats) ? newChats : prevChats;
          });
        }
      }
    };
    loadUserChats();
  }, [isSignedIn, userId, setChats]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/login");
    }
  }, [isLoaded, isSignedIn, router]);

  const handleFileChange = async (e) => {
    if (e.target.files?.[0]) {
      setFileName(e.target.files[0].name);
      setUploadedFile(e.target.files[0]);
      setQueryMode('upload');
    }
  };

  // Load messages for selected chat
  useEffect(() => {
    const loadMessages = async () => {
      if (selectedChatId) {
        try {
          const res = await fetch(`/api/messages?chatId=${selectedChatId}`);
          if (res.ok) {
            const data = await res.json();
            setMessages(data.messages || []);
          }
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      } else {
        setMessages([]);
      }
    };
    loadMessages();
  }, [selectedChatId]);

  // Handle sending messages in chat
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage = {
      content: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage("");
    setChatLoading(true);
    
    try {
      // Send message to AI with chat history integration
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: currentMessage,
          contractText: fileName,
          userId: userId,
          chatId: selectedChatId,
          saveToHistory: true
        }),
      });
      
      const data = await response.json();
      
      const aiMessage = {
        content: data.response,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // If a new chat was created, update the selected chat ID and refresh chat list
      if (data.chatId && !selectedChatId) {
        setSelectedChatId(data.chatId);
        
        // Refresh the chat list to show the new chat
        const chatRes = await fetch(`/api/chats?userId=${userId}`);
        if (chatRes.ok) {
          const chatData = await chatRes.json();
          setChats(chatData.chats || []);
        }
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        content: "Sorry, there was an error processing your message.",
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setAiResponse("");

    try {
      if (queryMode === 'existing') {
         // Handle querying from existing legal documents
        const formData = new FormData();
        formData.append("query", question);
        const response = await fetch('/api/ai/ask-existing', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setAiResponse(data.answer);
      } else if (queryMode === 'upload') {
        // Handle uploading PDF and querying
        if (!uploadedFile) throw new Error("No file uploaded!");
        const formData = new FormData();
        formData.append("query", question);
        formData.append("file", uploadedFile);

        const response = await fetch('/api/ai/ask-upload', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        setFileId(data.file_id);
        setAiResponse(data.answer);
      } else if (queryMode === 'context') {
        // Handle querying using file_id
        if (!fileId) throw new Error("No context available!");
        const formData = new FormData();
        formData.append("query", question);
        formData.append("file_id", fileId);

        const response = await fetch('/api/ai/ask-upload/context', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setAiResponse(data.answer);
      }
    } catch (error) {
      console.error('Error:', error);
      setAiResponse("Sorry, there was an error processing your request.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || !isSignedIn) return null;

  return (
    <>
      <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar /> {/* Add the Navbar at the top */}
        <main className="flex-1 p-6 flex overflow-hidden">
          {/* Sidebar for previous chats */}
          <div className="h-full overflow-hidden">
            <Sidebar
              userId={isSignedIn ? userId : null}
              onChatSelect={handleChatSelection}
              onNewChat={handleNewChatClick}
            />
          </div>
          {/* Main content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-3xl mx-auto bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm shadow-2xl border border-white/20 rounded-3xl p-8 space-y-6 mb-8">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  ⚖️ AI Legal Assistant
                </h1>
                <p className="text-gray-600 text-lg">Professional Contract Analysis & Legal Support</p>
              </div>

              {/* Query Mode Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🔍 Choose Query Mode
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setQueryMode('existing');
                      setFileName("");
                      setUploadedFile(null);
                      setFileId(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      queryMode === 'existing'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📚 Legal Database
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueryMode('upload')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      queryMode === 'upload'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📄 Upload PDF
                  </button>
                  {fileId && (
                    <button
                      type="button"
                      onClick={() => setQueryMode('context')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        queryMode === 'context'
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      🔄 Continue with Uploaded
                    </button>
                  )}
                </div>
              </div>

              {/* File Upload Section - Only show if upload mode */}
              {queryMode === 'upload' && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📄 Upload Contract (PDF)
                  </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-blue-500 file:to-indigo-600 file:text-white file:font-semibold file:shadow-lg hover:file:from-blue-600 hover:file:to-indigo-700 file:transition-all file:duration-200 border-2 border-dashed border-blue-300 rounded-xl p-4 hover:border-blue-400 transition-colors bg-blue-50/50"
                  />
                </div>
                {fileName && (
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-sm text-green-700">📄 {fileName} uploaded</p>
                    <button
                      type="button"
                      onClick={() => setFileName("")}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center"
                      aria-label="Remove file"
                    >
                      {/* Trash bin SVG icon */}
                      <div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                        >
                          <path fill="red" d="M 10.806641 2 C 10.289641 2 9.7956875 2.2043125 9.4296875 2.5703125 L 9 3 L 4 3 A 1.0001 1.0001 0 1 0 4 5 L 20 5 A 1.0001 1.0001 0 1 0 20 3 L 15 3 L 14.570312 2.5703125 C 14.205312 2.2043125 13.710359 2 13.193359 2 L 10.806641 2 z M 4.3652344 7 L 5.8925781 20.263672 C 6.0245781 21.253672 6.877 22 7.875 22 L 16.123047 22 C 17.121047 22 17.974422 21.254859 18.107422 20.255859 L 19.634766 7 L 4.3652344 7 z"></path>
                        </svg>
                      </div>
                    </button>
                  </div>
                )}
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ❓ Ask a Question
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g., What are the risks for the vendor? What clauses should I pay attention to?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="text-gray-800 w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none shadow-sm bg-white/80 backdrop-blur-sm transition-all duration-200 hover:shadow-md"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !question || (queryMode === 'upload' && !uploadedFile) || (queryMode === 'context' && !fileId)}
                  className={`px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${(loading || !question || (queryMode === 'upload' && !uploadedFile) || (queryMode === 'context' && !fileId)) && "opacity-50 cursor-not-allowed hover:scale-100"
                    }`}
                >
                  {loading ? (
                    <span className="flex items-center space-x-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                      </svg>
                      <span>Analyzing...</span>
                    </span>
                  ) : (
                    "🔍 Analyze Document"
                  )}
                </button>
              </div>

              {aiResponse && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-xl p-6 shadow-inner">
                  <h2 className="text-xl font-bold mb-3 text-blue-800 flex items-center">
                    <span className="mr-2">🤖</span> AI Analysis Results
                  </h2>
                  <div className="text-gray-700 whitespace-pre-line leading-relaxed bg-white/60 rounded-lg p-4 shadow-sm">
                    {aiResponse}
                  </div>
                </div>
              )}
            </div>
            
            {/* Chat Interface */}
            <div className="max-w-3xl mx-auto bg-gradient-to-br from-white via-purple-50/30 to-pink-50/50 backdrop-blur-sm shadow-2xl border border-white/20 rounded-3xl p-8 space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 bg-clip-text text-transparent mb-2">
                  💬 Interactive AI Chat
                </h2>
                <p className="text-gray-600">Have a real-time conversation with your AI legal assistant</p>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 border-2 border-blue-100 rounded-2xl p-6 shadow-inner">
                <div className="h-72 overflow-y-auto mb-6 space-y-3 custom-scrollbar">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🤖</div>
                      <p className="text-gray-500 text-lg">
                        Start a conversation with your AI assistant
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Ask questions about contracts, legal terms, or get general legal advice
                      </p>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-md ${
                            message.sender === 'user'
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-800'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 text-gray-800 max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-md">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <p className="text-sm">AI is thinking...</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !chatLoading && handleSendMessage()}
                    className="flex-1 p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md"
                    placeholder="Ask me anything about legal matters..."
                    disabled={chatLoading}
                  />
                  <button
                    className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:hover:scale-100"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || chatLoading}
                  >
                    {chatLoading ? (
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                      </svg>
                    ) : (
                      '🚀 Send'
                    )}
                  </button>
                </div>
              </div>
              
              {/* Signature Button */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setShowSignatureModal(true)}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                >
                  <span>📝</span>
                  <span>Digital Signature Pad</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Signature Modal */}
          <Modal isOpen={showSignatureModal} onClose={() => setShowSignatureModal(false)}>
            <SignaturePad uploadedFile={uploadedFile} fileName={fileName} />
          </Modal>
        </main>
      </div>
    </>
  );
}
