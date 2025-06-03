import React from "react";
import MarkdownIt from "markdown-it";
import markdownItTaskLists from "markdown-it-task-lists";
import markdownItMark from "markdown-it-mark";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});
md.use(markdownItTaskLists);
md.use(markdownItMark);

export default function MarkdownRenderer({ content = "" }) {
  const html = React.useMemo(() => md.render(content), [content]);
  return (
    <div
      className="md3-markdown prose prose-lg max-w-full"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}



