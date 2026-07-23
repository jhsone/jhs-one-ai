import { NextRequest, NextResponse } from 'next/server'
import { rateLimitMiddleware } from '@/lib/rate-limit'
import { exec } from 'child_process'
import { writeFileSync, unlinkSync, mkdirSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { promisify } from 'util'

const execAsync = promisify(exec)

const SUPPORTED_LANGUAGES: Record<string, { command: (file: string) => string; extension: string }> = {
  javascript: { command: (f) => `node "${f}"`, extension: 'js' },
  js: { command: (f) => `node "${f}"`, extension: 'js' },
  typescript: { command: (f) => `npx tsx "${f}"`, extension: 'ts' },
  ts: { command: (f) => `npx tsx "${f}"`, extension: 'ts' },
  python: { command: (f) => `python3 "${f}"`, extension: 'py' },
  py: { command: (f) => `python3 "${f}"`, extension: 'py' },
  bash: { command: (f) => `bash "${f}"`, extension: 'sh' },
  sh: { command: (f) => `bash "${f}"`, extension: 'sh' },
  shell: { command: (f) => `bash "${f}"`, extension: 'sh' },
}

const TIMEOUT_MS = 10_000
const MAX_OUTPUT_LENGTH = 50_000

export async function POST(req: NextRequest) {
  const rateLimitResponse = rateLimitMiddleware(req, 5, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { code, language } = await req.json()

    if (!code || !language) {
      return NextResponse.json({ error: 'code and language are required' }, { status: 400 })
    }

    const config = SUPPORTED_LANGUAGES[language.toLowerCase()]
    if (!config) {
      return NextResponse.json({
        output: '',
        error: `Language "${language}" is not supported for execution. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`,
        exitCode: 1,
      })
    }

    const tmpDir = '/tmp/sandbox'
    mkdirSync(tmpDir, { recursive: true })

    const filename = `sandbox-${randomUUID()}.${config.extension}`
    const filepath = join(tmpDir, filename)

    writeFileSync(filepath, code)

    try {
      const { stdout, stderr } = await execAsync(config.command(filepath), {
        timeout: TIMEOUT_MS,
        maxBuffer: MAX_OUTPUT_LENGTH,
        env: { ...process.env, NODE_NO_WARNINGS: '1' },
      })

      return NextResponse.json({
        output: stdout.slice(0, MAX_OUTPUT_LENGTH),
        error: stderr.slice(0, MAX_OUTPUT_LENGTH),
        exitCode: 0,
      })
    } catch (execError: any) {
      const stderr = execError.stderr || ''
      const stdout = execError.stdout || ''
      return NextResponse.json({
        output: stdout.slice(0, MAX_OUTPUT_LENGTH),
        error: (stderr || execError.message || 'Execution failed').slice(0, MAX_OUTPUT_LENGTH),
        exitCode: execError.code || 1,
      })
    } finally {
      try { unlinkSync(filepath) } catch {}
    }
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Sandbox failed' },
      { status: 500 }
    )
  }
}
