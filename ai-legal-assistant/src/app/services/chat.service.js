import axios from "axios";

export const chatService = {
  updateChat: async (chatId, updates) => {
    try {
      const { data } = await axios.patch(`/api/chats/${chatId}`, {
        title: updates.question, // Convert question to title for database
        fileName: updates.fileName
      });
      return {
        ...data,
        question: data.title // Convert title back to question for UI consistency
      };
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update chat');
    }
  },

  deleteChat: async (chatId) => {
    try {
      const { data } = await axios.delete(`/api/chats/${chatId}`);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete chat');
    }
  }
};
