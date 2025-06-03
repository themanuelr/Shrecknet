// editorExtensions.ts

import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import Youtube from "@tiptap/extension-youtube";

// Export as a function so you can customize/configure per instance if needed
export function getRichEditorExtensions() {
  return [
    StarterKit.configure({}),
    TextStyle,
    Color,
    Underline,
    Image,
    TaskList,
    TaskItem.configure({ nested: true }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Typography,
    Highlight.configure({ multicolor: true }),
    Link.configure({ openOnClick: false }),
    HorizontalRule,
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    Youtube.configure({ 
      width: 480,
      height: 280,
      controls: true,
      nocookie: true
    }),
    // <<--- NO Markdown extension here!
  ];
}