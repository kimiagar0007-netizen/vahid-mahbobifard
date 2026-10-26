/**
 * Very small block parser for the page bodies edited in the admin panel:
 *   "## Heading"      → h2
 *   "- item"          → list item (consecutive lines become one list)
 *   anything else     → paragraph
 */
export function parseContent(body = '') {
  const lines = String(body).replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let list = null;

  const flushList = () => {
    if (list && list.items.length) blocks.push(list);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      blocks.push({ type: 'h2', text: line.slice(3).trim() });
      continue;
    }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      if (!list) list = { type: 'ul', items: [] };
      list.items.push(line.slice(2).trim());
      continue;
    }
    flushList();
    blocks.push({ type: 'p', text: line });
  }
  flushList();
  return blocks;
}
