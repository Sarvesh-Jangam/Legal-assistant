// components/SignaturePad.js
'use client';
import { useRef, useEffect, useState } from 'react';
import SignaturePad from 'signature_pad';

export default function SignaturePadComponent() {
  const canvasRef = useRef(null);
  const signaturePadRef = useRef(null);
  const [imageURL, setImageURL] = useState(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = 500;
      canvas.height = 200;
      const signaturePad = new SignaturePad(canvas, {
        backgroundColor: '#f9fafb',
        penColor: '#0f172a',
      });
      signaturePadRef.current = signaturePad;
    }
  }, []);

  const clear = () => {
    signaturePadRef.current.clear();
    setImageURL(null);
  };

  const save = () => {
    if (signaturePadRef.current.isEmpty()) {
      alert("Please sign before saving.");
      return;
    }
    const dataURL = signaturePadRef.current.toDataURL();
    setImageURL(dataURL);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-bold text-gray-800">✍️ E-Signature</h2>

      <canvas
        ref={canvasRef}
        className="border border-gray-300 rounded-md w-full"
      />

      <div className="flex justify-between space-x-4">
        <button
          onClick={clear}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear
        </button>
        <button
          onClick={save}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save
        </button>
      </div>

      {imageURL && (
        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">Saved Signature:</h3>
          <img
            src={imageURL}
            alt="Saved Signature"
            className="border rounded-md max-w-full"
          />
        </div>
      )}
    </div>
  );
}
