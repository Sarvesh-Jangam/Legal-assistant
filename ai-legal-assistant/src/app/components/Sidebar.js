import { useEffect, useState } from "react";
import { useChatContext } from "../context/userContextProvider";
import { chatService } from "../services/chatService";

export default function Sidebar({ onChatSelect, onNewChat, userId }) {
  const {chats, setChats} = useChatContext();
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set loading to false when chats are loaded
    if (Array.isArray(chats) && chats.length > 0) {
      setIsLoading(false);
    }
  }, [chats]);

  return (
    <aside className="w-64 bg-white shadow-lg rounded-2xl p-6 mr-8 flex flex-col h-[calc(100vh-7rem)]">
      <h2 className="text-xl font-bold mb-4 text-gray-800">💬 Previous Chats</h2>
      <ul className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col space-y-4 p-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : chats.length === 0 ? (
          <li className="text-gray-500">No previous chats</li>
        ) : (
          chats.map((chat) => (
            <li
              key={chat._id}
              className="p-3 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-700 flex items-center justify-between group"
            >
              <div className="flex-1 mr-2">
                {editingId === chat._id ? (
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        try {
                          await chatService.updateChat(chat._id, {
                            title: editText
                          });
                          setChats(prevChats => 
                            prevChats.map(c => 
                              c._id === chat._id ? { ...c,title: editText } : c
                            )
                          );
                          setEditingId(null);
                        } catch (error) {
                          console.error('Error updating chat:', error);
                          alert(error.message);
                        }
                      } else if (e.key === 'Escape') {
                        setEditingId(null);
                      }
                    }}
                    className="w-full px-2 py-1 rounded border border-gray-300 focus:border-blue-500 focus:outline-none"
                    autoFocus
                    onBlur={() => setEditingId(null)}
                  />
                ) : (
                  <div 
                    className="cursor-pointer"
                    onClick={() => onChatSelect && onChatSelect(chat)}
                  >
                    {chat.title || "Untitled Chat"}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(chat._id);
                    setEditText(chat.title || "");
                  }}
                  className="p-1 hover:bg-blue-200 rounded"
                  title="Edit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    // if (window.confirm('Are you sure you want to delete this chat?')) {
                      try {
                        const result = await chatService.deleteChat(chat._id);
                        if (result.success) {
                          setChats(prevChats => prevChats.filter(c => c._id !== chat._id));
                        }
                      } catch (error) {
                        console.error('Error deleting chat:', error);
                        alert(error.message);
                      }
                    // }
                  }}
                  className="p-1 hover:bg-red-200 rounded"
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onNewChat}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Loading...
          </div>
        ) : '+ New Chat'}
      </button>
    </aside>
  );
}
