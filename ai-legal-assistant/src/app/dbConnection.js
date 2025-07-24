import { connectDB } from "./api/db/route";

export default dbConnect=async ()=>{
    await connectDB();
}