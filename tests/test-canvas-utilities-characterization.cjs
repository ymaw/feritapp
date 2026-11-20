const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');

function createCanvasContext() {
  const segments = [];
  const state = { strokeStyle: '', lineWidth: 0, beginPathCalls: 0, strokeCalls: 0 };
  return {
    segments,
    state,
    measureText(value) { return { width: String(value).length * 10 }; },
    set strokeStyle(value) { state.strokeStyle = value; },
    get strokeStyle() { return state.strokeStyle; },
    set lineWidth(value) { state.lineWidth = value; },
    get lineWidth() { return state.lineWidth; },
    beginPath() { state.beginPathCalls += 1; },
    moveTo(x, y) { segments.push({ type: 'move', x, y }); },
    lineTo(x, y) { segments.push({ type: 'line', x, y }); },
    stroke() { state.strokeCalls += 1; }
  };
}

(async function runCanvasUtilityTests() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'utils', 'canvas.js')).href;
  const { wrapCanvasText, truncateCanvasText, drawDashedLine } = await import(moduleUrl);
  const ctx = createCanvasContext();

  assert.deepEqual(wrapCanvasText(ctx, 'uno dos tres', 75), ['uno dos', 'tres']);
  assert.deepEqual(wrapCanvasText(ctx, 'palabraextensa corta', 30), ['palabraextensa', 'corta']);
  assert.deepEqual(wrapCanvasText(ctx, '', 50), []);
  assert.equal(truncateCanvasText(ctx, 'texto', 50), 'texto');
  assert.equal(truncateCanvasText(ctx, 'texto largo', 45), 'tex…');
  assert.equal(truncateCanvasText(ctx, 'a', 0), 'a…');

  drawDashedLine(ctx, 0, 7, 25);
  assert.equal(ctx.strokeStyle, '#dddddd');
  assert.equal(ctx.lineWidth, 2);
  assert.equal(ctx.state.beginPathCalls, 1);
  assert.equal(ctx.state.strokeCalls, 1);
  assert.deepEqual(ctx.segments, [
    { type: 'move', x: 0, y: 7 }, { type: 'line', x: 6, y: 7 },
    { type: 'move', x: 12, y: 7 }, { type: 'line', x: 18, y: 7 },
    { type: 'move', x: 24, y: 7 }, { type: 'line', x: 25, y: 7 }
  ]);

  console.log('OK Canvas utilities: text wrapping, truncation and dashed-line drawing preserve characterized behavior.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
