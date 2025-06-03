import React, { useState } from "react";
import ModalContainer from "../template/modalContainer";

export default function YouTubeDialog({
  open,
  input,
  setInput,
  closeDialog,
  editor,
}) {
  const [width, setWidth] = useState("480");
  const [height, setHeight] = useState("270");

  if (!open) return null;

  return (
    <ModalContainer title="Insert YouTube Video" onClose={closeDialog}>
      <input
        className="w-full border rounded px-2 py-1 mb-3"
        type="text"
        placeholder="Paste YouTube URL here"
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <div className="flex items-center gap-2 mb-2">
        <input
          className="w-16 border rounded px-1 py-1"
          type="number"
          placeholder="Width"
          value={width}
          onChange={e => setWidth(e.target.value)}
          min={100}
          max={1600}
        />
        <input
          className="w-16 border rounded px-1 py-1"
          type="number"
          placeholder="Height"
          value={height}
          onChange={e => setHeight(e.target.value)}
          min={100}
          max={900}
        />
        <button
          className="bg-[var(--primary)] text-white px-4 py-1 rounded shadow hover:bg-[var(--accent)] transition"
          onClick={() => {
            if (input) {
              editor?.chain().focus().setYoutubeVideo({
                src: input,
                width: width ? parseInt(width) : 480,
                height: height ? parseInt(height) : 270,
              }).run();
              closeDialog();
            }
          }}
          disabled={!input}
        >
          Insert
        </button>
        <button
          className="text-xs text-[var(--primary)] px-2 py-1 rounded"
          onClick={closeDialog}
        >
          Cancel
        </button>
      </div>
      {input && (
        <div className="flex items-center justify-center mt-4">
          <iframe
            title="YouTube Preview"
            width={width}
            height={height}
            src={getYoutubeEmbedUrl(input)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ borderRadius: "0.5em", border: "1px solid var(--primary)" }}
          />
        </div>
      )}
    </ModalContainer>
  );
}

function getYoutubeEmbedUrl(url) {
  try {
    const match = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/
    );
    const id = match?.[1];
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : "";
  } catch {
    return "";
  }
}
