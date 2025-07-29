import { NextResponse } from "next/server";
import Chat from "@/app/models/chat.model.js";
import Message from "@/app/models/message.model.js";
import mongoose from "mongoose";

export async function POST(request) {
    const { prompt, contractText, userId, chatId, saveToHistory = true } = await request.json();

    // Create FormData to match FastAPI endpoint expectations
    const formData = new FormData();
    formData.append("query", prompt);

    // Call Python backend chat endpoint
    const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get AI response');
    }

    // Save to chat history if requested
    if (saveToHistory && userId) {
        try {
            // Ensure mongoose is connected
            if (mongoose.connection.readyState === 0) {
                await mongoose.connect(process.env.MONGODB_URI);
            }

            let currentChatId = chatId;

            // Create new chat if no chatId provided
            if (!currentChatId) {
                const newChat = await Chat.create({
                    userId,
                    title: prompt.length > 50 ? prompt.substring(0, 50) + "..." : prompt,
                    fileName: contractText || ""
                });
                currentChatId = newChat._id.toString();
            }

            // Save user message
            await Message.create({
                chatId: currentChatId,
                sender: "user",
                content: prompt
            });

            // Save AI response
            await Message.create({
                chatId: currentChatId,
                sender: "ai",
                content: data.response
            });

            return NextResponse.json({ 
                response: data.response, 
                chatId: currentChatId,
                saved: true 
            });
        } catch (dbError) {
            console.error('Error saving to chat history:', dbError);
            // Still return the AI response even if saving fails
            return NextResponse.json({ 
                response: data.response, 
                saved: false,
                error: 'Failed to save chat history'
            });
        }
    }

    return NextResponse.json({ response: data.response });
}

