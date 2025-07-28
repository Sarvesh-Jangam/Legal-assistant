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

  const handleChatSelection = (chat) => {
    setSelectedChatId(chat._id);
    setQuestion(chat.title || "");
    setFileName(chat.fileName || "");
  };

  // Handle new chat button click
  const handleNewChatClick = () => {
    setSelectedChatId(null);
    setQuestion("");
    setFileName("");
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
      router.replace("/login"); // Redirect to login if not signed in
    }
  }, [isLoaded, isSignedIn, router]);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setFileName(e.target.files?.[0]?.name);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setAiResponse("");

    try {
      if (selectedChatId) {
        // Update existing chat
        const updatedChat = await chatService.updateChat(selectedChatId, {
          question:question.replace(/\s+/g, ' ') .trim(),
          fileName,
        });
        
        setAiResponse(updatedChat.response);
        setChats(prevChats =>
          prevChats.map(c =>
            c._id === selectedChatId ? updatedChat : c
          )
        );
      } else {
        // Save new chat
        const response = await fetch('/api/chats/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            question:question.replace(/\s+/g, ' ') .trim(), // This will be used to create the title in trimmed way removing whitespaces in between also
            fileName
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          setAiResponse(data.chat.response);
          setChats(prevChats => {
            const newChat = data.chat;
            return [newChat, ...prevChats];
          });
        } else {
          throw new Error(data.error);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setAiResponse("Sorry, there was an error processing your request.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return null; // Optionally show a loading spinner here
  }

  return (
    <>
      <div className="h-screen flex flex-col overflow-hidden">
        <Navbar /> {/* Add the Navbar at the top */}
        <main className="flex-1 bg-gray-100 p-6 flex overflow-hidden">
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
            <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-8 space-y-6 mb-6">
              <h1 className="text-3xl font-bold text-center text-gray-800"> AI Legal Assistant</h1>

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

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Ask a Question</label>
                <textarea
                  rows={4}
                  placeholder="e.g., What are the risks for the vendor?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="text-black w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
          <SignaturePad />
          </div>
        </main>
      </div>
    </>
  );
}