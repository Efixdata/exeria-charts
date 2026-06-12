type ZipEntry = {
  path: string;
  content: string;
};

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let crc = index;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    table[index] = crc >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index += 1) {
    crc = CRC_TABLE[(crc ^ bytes[index]!) & 0xff]! ^ (crc >>> 1);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16LE(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}

function writeUint32LE(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true);
}

export function createZipBlob(entries: ZipEntry[]): Blob {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.path);
    const dataBytes = encoder.encode(entry.content);
    const checksum = crc32(dataBytes);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);

    writeUint32LE(localView, 0, 0x04034b50);
    writeUint16LE(localView, 4, 20);
    writeUint16LE(localView, 6, 0);
    writeUint16LE(localView, 8, 0);
    writeUint16LE(localView, 10, 0);
    writeUint16LE(localView, 12, 0);
    writeUint32LE(localView, 14, checksum);
    writeUint32LE(localView, 18, dataBytes.length);
    writeUint32LE(localView, 22, dataBytes.length);
    writeUint16LE(localView, 26, nameBytes.length);
    writeUint16LE(localView, 28, 0);
    localHeader.set(nameBytes, 30);

    chunks.push(localHeader, dataBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    writeUint32LE(centralView, 0, 0x02014b50);
    writeUint16LE(centralView, 4, 20);
    writeUint16LE(centralView, 6, 20);
    writeUint16LE(centralView, 8, 0);
    writeUint16LE(centralView, 10, 0);
    writeUint16LE(centralView, 12, 0);
    writeUint16LE(centralView, 14, 0);
    writeUint32LE(centralView, 16, checksum);
    writeUint32LE(centralView, 20, dataBytes.length);
    writeUint32LE(centralView, 24, dataBytes.length);
    writeUint16LE(centralView, 28, nameBytes.length);
    writeUint16LE(centralView, 30, 0);
    writeUint16LE(centralView, 32, 0);
    writeUint16LE(centralView, 34, 0);
    writeUint16LE(centralView, 36, 0);
    writeUint32LE(centralView, 38, 0);
    writeUint32LE(centralView, 42, offset);
    centralHeader.set(nameBytes, 46);
    centralDirectory.push(centralHeader);

    offset += localHeader.length + dataBytes.length;
  }

  const centralSize = centralDirectory.reduce((sum, chunk) => sum + chunk.length, 0);
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  writeUint32LE(endView, 0, 0x06054b50);
  writeUint16LE(endView, 4, 0);
  writeUint16LE(endView, 6, 0);
  writeUint16LE(endView, 8, entries.length);
  writeUint16LE(endView, 10, entries.length);
  writeUint32LE(endView, 12, centralSize);
  writeUint32LE(endView, 16, offset);
  writeUint16LE(endView, 20, 0);

  return new Blob([...chunks, ...centralDirectory, endRecord], { type: "application/zip" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
