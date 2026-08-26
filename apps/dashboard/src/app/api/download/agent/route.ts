import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export async function GET() {
  try {
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'cli.mjs'),
      path.join(process.cwd(), 'apps', 'dashboard', 'public', 'cli.mjs'),
      path.join(process.cwd(), '..', 'tunnel-agent', 'ts', 'dist', 'cli.mjs'),
      path.join(process.cwd(), 'apps', 'tunnel-agent', 'ts', 'dist', 'cli.mjs'),
    ];

    let filePath = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }

    if (!filePath) {
      return new NextResponse('Agent file not found on server', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Content-Disposition': 'attachment; filename="cli.mjs"',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    return new NextResponse(`Error downloading agent: ${err.message}`, { status: 500 });
  }
}
