const replacements = new Map([
  ["Ā·", "·"],
  ["ā€“", "–"],
  ["ā€”", "—"],
  ["вњ“", "✓"],
  ["В·", "·"],
  ["вЂ“", "–"],
  ["вЂ”", "—"],
]);
function sanitize(root = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    let value = node.nodeValue;
    for (const [bad, good] of replacements) value = value.split(bad).join(good);
    if (value !== node.nodeValue) node.nodeValue = value;
  }
}
const app = document.querySelector("#app");
if (app)
  new MutationObserver(() => sanitize(app)).observe(app, {
    childList: true,
    subtree: true,
  });
sanitize();
