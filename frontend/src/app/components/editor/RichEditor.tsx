"use client";
import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { getRichEditorExtensions } from "./editorExtension";
import RichEditorToolbar from "./RichEditorToolbar";
import ImageDialog from "./ImageDialog";
import YouTubeDialog from "./YoutubeDialog";
import AddReferenceDialog from "./AddReferenceDialog";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { createPortal } from "react-dom";

function useDialog() {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  function openDialog(defaultValue = "") { setInput(defaultValue); setOpen(true); }
  function closeDialog() { setOpen(false); setInput(""); }
  return { open, input, setInput, openDialog, closeDialog };
}

function getWordCount(html = "") {
  return (html || "")
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export default function RichEditor({
  value,
  onChange,
  onSave,
  onCancel,
  maxWords = 4000,
  disabled = false,
  noImages = false,
  showSaveButtons = true,
  pageType,
  pageName,
}) {
  const { token } = useAuth(); // <-- Get your auth token here

  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);    
  
  // Dialog hooks
  const imageDialog = useDialog();
  const youtubeDialog = useDialog();
  const referenceDialog = useDialog();

  // Setup the editor (NO Markdown extensions)
  const editor = useEditor({
    extensions: getRichEditorExtensions(),
    content: value || "",
    editable: !disabled,
    autofocus: true,
    onUpdate: ({ editor }) => {
      if (onChange) {
        const html = editor.getHTML();
        onChange(html);
      }
    },
  });

  // Sync with parent (HTML only!)
  React.useEffect(() => {
    if (editor && typeof value === "string" && value !== editor.getHTML()) {
      editor.commands.setContent(value, false); // HTML mode
    }
  }, [editor, value]);

  const EditorBox = (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[99999] bg-[var(--background)] bg-opacity-95 flex flex-col items-center justify-start p-0 m-0 overflow-y-auto min-h-screen"
          : "relative w-full"
      }
      style={
        isFullscreen
          ? { left: 0, top: 0, width: "100vw", minHeight: "100vh", height: "auto" }
          : {}
      }
    >
      <RichEditorToolbar
        editor={editor}
        setIsFullscreen={setIsFullscreen}
        isFullscreen={isFullscreen}
        imageDialog={imageDialog}
        youtubeDialog={youtubeDialog}
        referenceDialog={referenceDialog} // Pass dialog hook to toolbar
        noImages={noImages}
      />
      <div
        className={
          "tiptap-editor bg-white/80 border-b border-[var(--primary)]/10 " +
          (isFullscreen ? " fullscreen rounded-b-xl max-w-5xl mx-auto" : "rounded-b-xl")
        }
        style={{
          minHeight: isFullscreen ? "70vh" : 220,
          width: isFullscreen ? "90vw" : undefined,
          maxWidth: isFullscreen ? "90vw" : undefined,
          margin: isFullscreen ? "0 auto" : undefined,
          boxSizing: "border-box",
        }}
      >
        <div className="content-wrapper p-4">
          <EditorContent editor={editor} role="presentation" />
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 px-2">
        <span className="text-xs text-[var(--primary)] opacity-70">
          {getWordCount(editor?.getHTML() || "")} / {maxWords} words
        </span>
        {showSaveButtons && (
          <div className="flex gap-2">
            {onCancel && (
              <button
                className="px-5 py-1 bg-[var(--primary)]/10 text-[var(--primary)] font-semibold rounded-lg hover:bg-[var(--primary)]/20 transition text-base"
                type="button"
                onClick={onCancel}
                disabled={disabled}
              >
                Cancel
              </button>
            )}
            {onSave && (
              <button
                className="px-5 py-1 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold rounded-lg shadow hover:bg-[var(--accent)] hover:text-[var(--background)] transition text-base"
                type="button"
                onClick={async () => {
                  setSaving(true);
                  const html = editor?.getHTML();
                  await onSave(html);
                  setSaving(false);
                  setIsFullscreen(false);
                }}
                disabled={disabled || saving}
              >
                Save
              </button>
            )}
          </div>
        )}
      </div>
      <ImageDialog
        open={imageDialog.open}
        input={imageDialog.input}
        setInput={imageDialog.setInput}
        closeDialog={imageDialog.closeDialog}
        editor={editor}
        pageType={pageType}
        pageName={pageName}
      />
      <YouTubeDialog
        open={youtubeDialog.open}
        input={youtubeDialog.input}
        setInput={youtubeDialog.setInput}
        closeDialog={youtubeDialog.closeDialog}
        editor={editor}
      />
      <AddReferenceDialog
        open={referenceDialog.open}
        input={referenceDialog.input}        
        closeDialog={referenceDialog.closeDialog}        
        token={token}
        onInsert={({ page, world, label }) => {
          const url = `/worlds/${world.id}/concept/${page.concept_id}/page/${page.id}`;;
          editor.chain().focus().extendMarkRange("link").setLink({
            href: url,
            class: "wiki-link",
            title: label || page.name,
          }).run();
          referenceDialog.closeDialog();
        }}
      />
    </div>
  );

  return isFullscreen && typeof window !== "undefined"
  ? createPortal(EditorBox, document.body)
  : EditorBox;
}
