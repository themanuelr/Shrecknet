export function autoLinkWikiContent(content, allPages, currentWorldId, allowCrossWorld) {
    if (!content || !Array.isArray(allPages) || !currentWorldId) return content;
    let result = content;
    // Only scan for <p>, <span>, <div> and plain text nodes (not already linked)
    // 1. Sort by descending length so longer names get linked first (avoid partial overlap)
    const sortedPages = allPages.slice().sort((a, b) => b.name.length - a.name.length);
    // 2. Build set of names and link targets already in the content
    //    For performance, we can use regex for <a ...>existing name</a>
    const anchorRE = /<a [^>]*?>(.*?)<\/a>/g;
    const linkedNames = new Set();
    let m; while ((m = anchorRE.exec(result)) !== null) linkedNames.add(m[1]);
  
    for (const page of sortedPages) {
      if (!page.name) continue;
      if (!allowCrossWorld && page.gameworld_id != currentWorldId) continue;
      if (linkedNames.has(page.name)) continue;
      // Use regex to match exact phrase (not inside <a>), word boundaries, case-insensitive
      // Negative lookbehind for ">", negative lookahead for "</a>"
      const linkRE = new RegExp(`(?<![>\\w])(${escapeRegExp(page.name)})(?![\\w<])`, "g");
      const url = `/worlds/${page.gameworld_id}/concept/${page.concept_id}/page/${page.id}`;
      result = result.replace(linkRE, (match, group1, offset, str) => {
        // Quick check: don't add if already inside an anchor
        const before = str.slice(0, offset);
        if (before.endsWith(">") && str.slice(offset - 3, offset) === "a>") return match;
        return `<a class="wiki-link" href="${url}">${page.name}</a>`;
      });
    }
    return result;
  }
  
  // Helper to safely escape names for regex
  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  