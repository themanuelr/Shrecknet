import React from "react";
import { FaBold, FaItalic, FaUnderline, FaHeading, FaListUl, FaListOl, FaTasks, FaQuoteRight, FaHighlighter, FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify, FaImage, FaUndo, FaRedo, FaExpand, FaCompress, FaTimes, FaStrikethrough, FaCode, FaTable, FaYoutube } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import { MdHorizontalRule } from "react-icons/md";
import { MdOutlineFindInPage } from "react-icons/md";

// Colors for text and highlight palettes
const COLORS = [
  "#7b2ff2", "#e0c3fc", "#291966", "#231b36", "#f6f1fc", "#ff4f81", "#35c8df", "#fed766", "#27ae60", "#fff"
];

// ----- Helper Components -----
function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      className={`rounded-md px-2 py-1 mx-0.5 flex items-center gap-1 text-[var(--primary)] bg-transparent hover:bg-[var(--primary)]/12 transition border border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${active ? "bg-[var(--primary)]/15 font-bold" : ""} ${disabled ? "opacity-30" : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      tabIndex={-1}
    >
      {children}
    </button>
  );
}

function Dropdown({ icon, label, children }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative inline-block">
      <button type="button"
        className="rounded-md px-2 py-1 flex items-center gap-1 text-[var(--primary)] bg-transparent hover:bg-[var(--primary)]/15 border border-transparent"
        onClick={() => setOpen(o => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
      >
        {icon} {label} <FiChevronDown />
      </button>
      {open && (
        <div className="absolute left-0 z-30 mt-1 min-w-[120px] bg-[var(--surface)] border border-[var(--primary)]/15 rounded-lg shadow-xl p-1 flex flex-col">
          {children}
        </div>
      )}
    </div>
  );
}

// ----- Main Toolbar Component -----
export default function RichEditorToolbar({
  editor,
  setIsFullscreen,
  isFullscreen,
  imageDialog,
  youtubeDialog,
  referenceDialog ,
  noImages,
}) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-1 px-1 py-1 bg-[var(--surface-variant)] border-b border-[var(--primary)]/10 rounded-t-2xl z-10">
      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        title="Undo"
      ><FaUndo /></ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        title="Redo"
      ><FaRedo /></ToolbarButton>
      {/* Headings */}
      <Dropdown icon={<FaHeading />} label="Heading">
        {[2, 3, 4, 5, 6].map(level => (
          <ToolbarButton
            key={level}
            onClick={() => { editor.chain().focus().toggleHeading({ level }).run(); }}
            active={editor.isActive("heading", { level })}
            title={`Heading ${level}`}
          >H{level}</ToolbarButton>
        ))}
        <ToolbarButton
          onClick={() => { editor.chain().focus().setParagraph().run(); }}
          active={editor.isActive("paragraph")}
          title="Paragraph"
        >Text</ToolbarButton>
      </Dropdown>
      {/* Lists */}
      <Dropdown icon={<FaListUl />} label="List">
        <ToolbarButton
          onClick={() => { editor.chain().focus().toggleBulletList().run(); }}
          active={editor.isActive("bulletList")}
          title="Bullet List"
        ><FaListUl /></ToolbarButton>
        <ToolbarButton
          onClick={() => { editor.chain().focus().toggleOrderedList().run(); }}
          active={editor.isActive("orderedList")}
          title="Numbered List"
        ><FaListOl /></ToolbarButton>
        <ToolbarButton
          onClick={() => { editor.chain().focus().toggleTaskList().run(); }}
          active={editor.isActive("taskList")}
          title="Task List"
        ><FaTasks /></ToolbarButton>
      </Dropdown>
      {/* Block elements */}
      <ToolbarButton
        onClick={() => { editor.chain().focus().toggleBlockquote().run(); }}
        active={editor.isActive("blockquote")}
        title="Blockquote"
      ><FaQuoteRight /></ToolbarButton>
      <ToolbarButton
        onClick={() => { editor.chain().focus().setHorizontalRule().run(); }}
        title="Horizontal Rule"
      ><MdHorizontalRule /></ToolbarButton>
      {/* Tables */}
      <Dropdown icon={<FaTable />} label="Table">
        <ToolbarButton
          onClick={() => { editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); }}
          title="Insert Table"
        >Insert</ToolbarButton>
        <ToolbarButton
          onClick={() => { editor.chain().focus().addColumnBefore().run(); }}
          title="Add Col Before"
        >Col +</ToolbarButton>
        <ToolbarButton
          onClick={() => { editor.chain().focus().addRowBefore().run(); }}
          title="Add Row Before"
        >Row +</ToolbarButton>
        <ToolbarButton
          onClick={() => { editor.chain().focus().deleteTable().run(); }}
          title="Delete Table"
        >Delete</ToolbarButton>
      </Dropdown>
      {/* Bold/Italic/Underline/Strike/Code/Highlight */}
      <ToolbarButton
        onClick={() => { editor.chain().focus().toggleBold().run(); }}
        active={editor.isActive("bold")}
        title="Bold"
      ><FaBold /></ToolbarButton>
      <ToolbarButton
        onClick={() => { editor.chain().focus().toggleItalic().run(); }}
        active={editor.isActive("italic")}
        title="Italic"
      ><FaItalic /></ToolbarButton>
      <ToolbarButton
        onClick={() => { editor.chain().focus().toggleUnderline().run(); }}
        active={editor.isActive("underline")}
        title="Underline"
      ><FaUnderline /></ToolbarButton>
      <ToolbarButton
        onClick={() => { editor.chain().focus().toggleStrike().run(); }}
        active={editor.isActive("strike")}
        title="Strike"
      ><FaStrikethrough /></ToolbarButton>
      <ToolbarButton
        onClick={() => { editor.chain().focus().toggleCode().run(); }}
        active={editor.isActive("code")}
        title="Inline Code"
      ><FaCode /></ToolbarButton>
      {/* Color/Highlight */}
      <Dropdown icon={<FaHighlighter />} label="Color">
        <div className="flex flex-wrap gap-1 px-2 py-1">
          {COLORS.map(color => (
            <button
              key={color}
              title={color}
              onClick={() => editor.chain().focus().setColor(color).run()}
              style={{ backgroundColor: color, width: 22, height: 22, borderRadius: 5, border: '1.5px solid #ddd' }}
              className="m-0.5"
            />
          ))}
        </div>
        <div className="text-xs opacity-70 px-2 pt-1">Text color</div>
        <div className="flex flex-wrap gap-1 px-2 py-1">
          {COLORS.map(color => (
            <button
              key={color+"hl"}
              title={color}
              onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
              style={{ backgroundColor: color, width: 22, height: 22, borderRadius: 5, border: '1.5px solid #ddd' }}
              className="m-0.5"
            />
          ))}
        </div>
        <div className="text-xs opacity-70 px-2 pt-1">Highlight</div>
      </Dropdown>
      {/* Text alignment */}
      <Dropdown icon={<FaAlignLeft />} label="Align">
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="Align Left"
        ><FaAlignLeft /></ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="Align Center"
        ><FaAlignCenter /></ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="Align Right"
        ><FaAlignRight /></ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          active={editor.isActive({ textAlign: "justify" })}
          title="Justify"
        ><FaAlignJustify /></ToolbarButton>
      </Dropdown>
      {/* Image */}
      {!noImages && (
        <ToolbarButton
          onClick={() => imageDialog.openDialog("")}
          title="Insert Image"
        ><FaImage /></ToolbarButton>
      )}
      {/* YouTube */}
      <ToolbarButton
        onClick={() => youtubeDialog.openDialog("")}
        title="Insert YouTube"
      ><FaYoutube /></ToolbarButton>

      <ToolbarButton
        onClick={() => referenceDialog.openDialog(editor?.view.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to) || "")}
        disabled={editor.state.selection.empty}
        title="Add Reference"
      >
        <MdOutlineFindInPage size={19} />
      </ToolbarButton>      


      {/* Fullscreen/Exit */}
      <ToolbarButton
        onClick={() => setIsFullscreen(f => !f)}
        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      >{isFullscreen ? <FaCompress /> : <FaExpand />}</ToolbarButton>
      {isFullscreen && (
        <ToolbarButton
          onClick={() => setIsFullscreen(false)}
          title="Close"
        ><FaTimes /></ToolbarButton>
      )}
    </div>
  );
}
