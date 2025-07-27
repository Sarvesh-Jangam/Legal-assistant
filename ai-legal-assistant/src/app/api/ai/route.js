import { NextResponse } from "next/server";

export async function POST(request) {
    const { prompt, contractText } = await request.json();

    const fullPrompt = `
You are a legal assistant. Here is a contract:
---
${contractText}
---
User question: ${prompt}
Please answer based on the contract above.
  `;
    const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }]
            })
        }
    );

    const data = await geminiResponse.json();
    // Gemini's response is in data.candidates[0].content.parts[0].text
    const answer =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't generate a response.";

    return NextResponse.json({ response: answer });
}