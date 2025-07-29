import { NextResponse } from "next/server";

export async function POST(request) {
    const { prompt, contractText } = await request.json();

    // Create FormData to match FastAPI endpoint expectations
    const formData = new FormData();
    formData.append("query", prompt);

    // Call Python backend chat endpoint
    const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        body: formData,
    });

    const data = await response.json();

    return NextResponse.json({ response: data.response });
}

