import React, { useState } from "react";
import { uploadImage } from "@/app/lib/uploadImage";
import ModalContainer from "../template/modalContainer";
import Image from "next/image";
export default function ImageDialog({
  open,
  input,
  setInput,
  closeDialog,
  editor,
  pageType,
  pageName,
}) {
    const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [width, setWidth] = useState("");   // New!
  const [height, setHeight] = useState(""); // New!

  if (!open) return null;

  return (
    <ModalContainer title="Insert Image" onClose={closeDialog}>
      <input
        className="w-full border rounded px-2 py-1 mb-2"
        type="text"
        placeholder="Paste image URL here"
        value={input}
        onChange={e => setInput(e.target.value)}
        disabled={loading}
      />
      <div className="flex items-center gap-2 mb-2">
        <label className="bg-[var(--accent)]/30 px-3 py-1 rounded cursor-pointer flex items-center gap-2">
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={async e => {
              const file = e.target.files?.[0];
              if (file) {                
                
                setLoading(true);
                setError("");
                try {
                  const url = await uploadImage(file, pageType || "page", pageName || "image");
                  setInput(url);
                } catch (err) {
                  setError("Image upload failed!" + err);
                }
                setLoading(false);
              }
            }}
            disabled={loading}
          />
          Upload
        </label>
        <input
          className="w-16 border rounded px-1 py-1"
          type="number"
          placeholder="Width"
          value={width}
          onChange={e => setWidth(e.target.value)}
          min={10}
          max={1600}
        />
        <input
          className="w-16 border rounded px-1 py-1"
          type="number"
          placeholder="Height"
          value={height}
          onChange={e => setHeight(e.target.value)}
          min={10}
          max={1200}
        />
        <button
          className="bg-[var(--primary)] text-white px-4 py-1 rounded shadow hover:bg-[var(--accent)] transition"
          onClick={() => {
            if (input) {
              editor?.chain().focus().setImage({
                src: input,
                width: width ? parseInt(width) : undefined,
                height: height ? parseInt(height) : undefined,
              }).run();
              closeDialog();
              setWidth(""); setHeight("");
            }
          }}
          disabled={loading || !input}
        >
          Insert
        </button>
        <button
          className="text-xs text-[var(--primary)] px-2 py-1 rounded"
          onClick={closeDialog}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
      {loading && <div className="text-xs text-[var(--primary)]">Uploading image…</div>}
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
      {input && (
        <div className="flex items-center justify-center mt-3">

                    <Image
                     src={input}
                     alt="preview"
                     width={400}
                     height={400}
                     style={{
                       maxWidth: "100%",
                       maxHeight: 120,
                       borderRadius: "0.5em",
                       border: "1px solid var(--primary)",
                       objectFit: "contain",
                       width: width ? width + "px" : undefined,
                       height: height ? height + "px" : undefined,}}
                    />

        </div>
      )}
    </ModalContainer>
  );
}
