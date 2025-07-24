import { connectDB } from "@/app/db";
import { NextResponse } from "next/server";

export async function GET(request){
    const response1=await connectDB();
    // JSON.parse(response1);
    return NextResponse.json({
        response1:response1
    })
    
}