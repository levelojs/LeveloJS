// playground/build-bin.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bundlePath = path.resolve(__dirname, "dist-native/bundle.js");
const outBinPath = path.resolve(__dirname, "dist-native/app.bin");

if (!fs.existsSync(bundlePath)) {
  console.error("Error: dist-native/bundle.js paowa jayni! Age 'npm run build:native' chalao.");
  process.exit(1);
}

await import(`file://${bundlePath}`);

const commands: any[] = (globalThis as any).__LEVELO_BATCH__ || [];

if (!commands.length) {
  console.error("Error: __LEVELO_BATCH__ e kono command paowa jayni!");
  process.exit(1);
}

console.log(`[Levelo Binary Builder] Total ${commands.length} operations paowa geche. Encoding shuru hocche...`);

const STYLE_KEYS: Record<string, number> = {
  x: 1,
  y: 2,
  width: 3,
  height: 4,
  "font-size": 5,
  "border-radius": 6,
  "border-width": 7,
  background: 8,
  "background-color": 8,
  color: 9,
  "border-color": 10,
};

const EVENT_KEYS: Record<string, number> = {
  click: 1,
  mousedown: 2,
  mouseup: 3,
  input: 4,
};

const buffer = new ArrayBuffer(commands.length * 128);
const view = new DataView(buffer);
let offset = 0;
const encoder = new TextEncoder();

for (const cmd of commands) {
  switch (cmd.op) {
    case "CreateElement": {
      view.setUint8(offset++, 0x01); // Opcode 0x01
      view.setBigUint64(offset, BigInt(cmd.node), true);
      offset += 8;

      const bytes = encoder.encode(cmd.element_type);
      view.setUint16(offset, bytes.length, true);
      offset += 2;
      new Uint8Array(buffer, offset, bytes.length).set(bytes);
      offset += bytes.length;
      break;
    }

    case "CreateText": {
      view.setUint8(offset++, 0x02); // Opcode 0x02
      view.setBigUint64(offset, BigInt(cmd.node), true);
      offset += 8;

      const bytes = encoder.encode(cmd.text);
      view.setUint16(offset, bytes.length, true);
      offset += 2;
      new Uint8Array(buffer, offset, bytes.length).set(bytes);
      offset += bytes.length;
      break;
    }

    case "AppendChild": {
      view.setUint8(offset++, 0x03); // Opcode 0x03
      view.setBigUint64(offset, BigInt(cmd.parent), true);
      offset += 8;
      view.setBigUint64(offset, BigInt(cmd.child), true);
      offset += 8;
      break;
    }

    case "SetStyle": {
      const keyId = STYLE_KEYS[cmd.name];
      if (!keyId) break;

      view.setUint8(offset++, 0x04); // Opcode 0x04
      view.setBigUint64(offset, BigInt(cmd.node), true);
      offset += 8;

      view.setUint8(offset++, keyId);

      const bytes = encoder.encode(cmd.value);
      view.setUint16(offset, bytes.length, true);
      offset += 2;
      new Uint8Array(buffer, offset, bytes.length).set(bytes);
      offset += bytes.length;
      break;
    }

    case "AddEventListener": {
      const eventId = EVENT_KEYS[cmd.event] || 0xff;
      view.setUint8(offset++, 0x05); // Opcode 0x05
      view.setBigUint64(offset, BigInt(cmd.node), true);
      offset += 8;

      view.setUint8(offset++, eventId);
      view.setBigUint64(offset, BigInt(cmd.listener_id), true);
      offset += 8;
      break;
    }
  }
}

const finalBinary = new Uint8Array(buffer, 0, offset);
fs.writeFileSync(outBinPath, finalBinary);

console.log(`[Levelo Binary Builder] Shofolbhabe '${outBinPath}' toiri hoyeche!`);
console.log(`[Levelo Binary Builder] File size: ${(finalBinary.length / 1024).toFixed(2)} KB (${finalBinary.length} bytes)`);