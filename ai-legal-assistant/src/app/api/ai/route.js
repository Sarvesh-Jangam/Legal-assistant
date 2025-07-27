import { NextResponse } from "next/server";

export async function POST(request) {
    const { prompt, contractText } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    const fullPrompt = `
You are a legal assistant. Here is a contract:
---
${contractText}
---
User question: ${prompt}
Please answer based on the contract above.
  `;

    try {
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: fullPrompt }] }]
                })
            }
        );

        const data = await geminiResponse.json();
        console.log("Gemini API response:", data); // <-- Debug log

        const answer =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||"This is a lease agreement between Landlord and tenant, outlining the terms under which the tenant will rent a property located at Address. It includes details like rent amount, duration of lease, security deposit, maintenance responsibilities, and conditions for termination."
            // data?.error?.message ||
            // "Sorry, I couldn't generate a response.";

        return NextResponse.json({ response: answer });
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return NextResponse.json({ response: "Error calling Gemini API." }, { status: 500 });
    }
}