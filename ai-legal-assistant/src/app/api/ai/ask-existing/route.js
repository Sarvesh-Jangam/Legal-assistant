// pages/api/ask-existing.js

import { NextResponse } from "next/server";

export async function POST(req) {
  const formData = await req.formData();
  const query = formData.get("query");

  const response = await fetch("http://localhost:8000/ask-existing", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  return NextResponse.json(data);
}