import parse, { domToReact } from "html-react-parser";
import WikiLinkHoverCard from "./WikiLinkHoverCard";

export default function HTMLRenderer({ content = "" }) {
  return (
    <div className="md3-markdown prose prose-lg max-w-full">
      {parse(content, {
        replace: domNode => {
          if (domNode.name === "a" && domNode.attribs && domNode.attribs.class?.includes("wiki-link")) {
            return (
              <WikiLinkHoverCard href={domNode.attribs.href}>
                {domToReact(domNode.children)}
              </WikiLinkHoverCard>
            );
          }
        }
      })}
    </div>
  );
}