import { spawn } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { getOutputDir } from '../store/session-store.js';

export interface InvokerResult {
  mode: 'auto' | 'manual';
  success: boolean;
  outputDir: string;
  error?: string;
}

/**
 * Auto mode: invoke Claude CLI subprocess with synthesis prompt.
 * Manual mode: write prompt to file for user to process.
 */
export async function invokeSynthesis(
  sessionId: string,
  prompt: string,
  manual: boolean = false
): Promise<InvokerResult> {
  const outputDir = getOutputDir(sessionId);

  if (manual) {
    return invokeManual(sessionId, prompt, outputDir);
  }

  // Try auto mode first
  try {
    return await invokeAuto(sessionId, prompt, outputDir);
  } catch (err) {
    console.warn(
      `Auto synthesis failed: ${err instanceof Error ? err.message : err}`
    );
    console.warn('Falling back to manual mode...');
    return invokeManual(sessionId, prompt, outputDir);
  }
}

async function invokeAuto(
  _sessionId: string,
  prompt: string,
  outputDir: string
): Promise<InvokerResult> {
  // Check if claude CLI is available
  const claudeAvailable = await checkClaudeCli();
  if (!claudeAvailable) {
    throw new Error('Claude CLI not found. Install it or use --manual flag.');
  }

  return new Promise((resolve, reject) => {
    const child = spawn(
      'claude',
      [
        '--dangerously-skip-permissions',
        '-p',
        prompt,
        '--output-dir',
        outputDir,
      ],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      }
    );

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({
          mode: 'auto',
          success: true,
          outputDir,
        });
      } else {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

function invokeManual(
  _sessionId: string,
  prompt: string,
  outputDir: string
): InvokerResult {
  const promptPath = resolve(outputDir, '..', 'synthesis-prompt.md');
  writeFileSync(promptPath, prompt, 'utf-8');

  return {
    mode: 'manual',
    success: true,
    outputDir,
  };
}

function checkClaudeCli(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('claude', ['--version'], {
      stdio: 'pipe',
      shell: true,
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });

    child.on('error', () => {
      resolve(false);
    });
  });
}
