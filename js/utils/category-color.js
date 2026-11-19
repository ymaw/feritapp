const CATEGORY_COLORS = ['#446DF6','#08A4BD','#17A897','#B23A52','#8C4A9C','#5FA8A0','#6C8EBF','#C9A15F'];

export function categoryColor(name) {
  const value = String(name || '');
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
}
