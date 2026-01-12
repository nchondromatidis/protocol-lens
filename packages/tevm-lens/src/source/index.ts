// source decoder

type Source = {
  name: string;
  content: Buffer; // Buffer.from(solcInput.sources[sourcePath]?.content, 'utf8')
};

export function srcDecoder(src: string, source: Source): string {
  const [begin, ,] = src.split(':').map(Number);
  const { name, content } = source;
  const line = 1 + countInBuffer(content.subarray(0, begin), '\n');
  return name + ':' + line;
}

function countInBuffer(buf: Buffer, str: string): number {
  let count = 0;
  let from = 0;
  while (true) {
    const i = buf.indexOf(str, from);
    if (i === -1) break;
    count += 1;
    from = i + str.length;
  }
  return count;
}
