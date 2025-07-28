'use client';
import { useRef, useEffect, useState } from "react";
import SignaturePad from "signature_pad";

export default function SignaturePadComponent() {
  const canvasRef = useRef(null);
  const signaturePadRef = useRef(null);
  const [imageURL, setImageURL] = useState(null);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    
    // Get display size of canvas in CSS pixels
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.getContext("2d").scale(ratio, ratio);

    // Clear and reinitialize the pad after resize
    signaturePadRef.current?.clear();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const signaturePad = new SignaturePad(canvas, {
      backgroundColor: "#fdfbff",
      penColor: "#4f46e5",
    });
    signaturePadRef.current = signaturePad;

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const clear = () => {
    signaturePadRef.current?.clear();
    setImageURL(null);
  };

  const save = () => {
    if (signaturePadRef.current?.isEmpty()) {
      alert("Please sign before saving.");
      return;
    }
    const dataURL = signaturePadRef.current.toDataURL();
    setImageURL(dataURL);
  };

  return (
    <div className="mt-10 p-6 rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-blue-50 shadow-2xl space-y-5">
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-blue-700 text-center drop-shadow-sm">
        ✍️ Sign the Agreement
      </h2>

      {/* Canvas wrapper for controlled layout */}
      <div className="w-full max-w-xl mx-auto">
        <canvas
          ref={canvasRef}
          className="w-full h-[250px] border-2 border-dashed border-purple-300 rounded-xl shadow-inner bg-white"
        />
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={clear}
          className="px-6 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-md hover:brightness-110 transition"
        >
          Clear
        </button>
        <button
          onClick={save}
          className="px-6 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md hover:brightness-110 transition"
        >
          Save
        </button>
      </div>

      {imageURL && (
        <div className="pt-4 text-center">
          <p className="text-sm text-gray-600 mb-2 font-medium">✅ Signature Preview:</p>
          <img
            src={imageURL}
            alt="Saved Signature"
            className="inline-block border-2 border-blue-300 rounded-lg shadow"
          />
        </div>
      )}
    </div>
  );
}
