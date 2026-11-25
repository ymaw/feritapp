const BUFFER_SIZE = 4096;

class VoskPcmProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(BUFFER_SIZE);
    this.offset = 0;
  }

  process(inputs, outputs) {
    const input = inputs[0] && inputs[0][0];
    const output = outputs[0] && outputs[0][0];
    if (output) output.fill(0);
    if (!input) return true;

    let sourceOffset = 0;
    while (sourceOffset < input.length) {
      const count = Math.min(BUFFER_SIZE - this.offset, input.length - sourceOffset);
      this.buffer.set(input.subarray(sourceOffset, sourceOffset + count), this.offset);
      this.offset += count;
      sourceOffset += count;

      if (this.offset === BUFFER_SIZE) {
        const completed = this.buffer;
        this.buffer = new Float32Array(BUFFER_SIZE);
        this.offset = 0;
        this.port.postMessage(completed, [completed.buffer]);
      }
    }
    return true;
  }
}

registerProcessor('vosk-pcm-processor', VoskPcmProcessor);
