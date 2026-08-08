import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import sharp from 'sharp';

export async function compressImageToWebp(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).webp({ quality: 75 }).toBuffer();
}

const GS_CANDIDATES = process.platform === 'win32'
  ? ['gswin64c', 'gswin32c', 'gs']
  : ['gs'];

function runGhostscript(bin: string, args: string[]): Promise<{ code: number | null; spawnError?: Error }> {
  return new Promise((resolve) => {
    const proc = spawn(bin, args);
    proc.on('error', (spawnError) => resolve({ code: null, spawnError }));
    proc.on('close', (code) => resolve({ code }));
  });
}

/**
 * Recompresses a PDF via Ghostscript (downsamples embedded images, the main
 * source of PDF bloat for scanned documents). Falls back to the original
 * buffer untouched if Ghostscript isn't installed on this machine, or if the
 * result isn't actually smaller.
 */
export async function compressPdfBuffer(buffer: Buffer): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `pdf-in-${randomUUID()}.pdf`);
  const outputPath = path.join(tmpDir, `pdf-out-${randomUUID()}.pdf`);
  fs.writeFileSync(inputPath, buffer);

  try {
    for (const bin of GS_CANDIDATES) {
      const { code, spawnError } = await runGhostscript(bin, [
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.4',
        '-dPDFSETTINGS=/ebook',
        '-dNOPAUSE',
        '-dBATCH',
        '-dQUIET',
        `-sOutputFile=${outputPath}`,
        inputPath,
      ]);
      if (spawnError) continue;
      if (code === 0 && fs.existsSync(outputPath)) {
        const compressed = fs.readFileSync(outputPath);
        return compressed.length > 0 && compressed.length < buffer.length ? compressed : buffer;
      }
      return buffer;
    }
    return buffer;
  } finally {
    fs.rmSync(inputPath, { force: true });
    if (fs.existsSync(outputPath)) fs.rmSync(outputPath, { force: true });
  }
}
