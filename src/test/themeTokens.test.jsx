import fs from 'node:fs';
import path from 'node:path';
import { cwd } from 'node:process';
import { describe, expect, it } from 'vitest';

const css = fs.readFileSync(path.join(cwd(), 'src/index.css'), 'utf8');
const rootBlock = css.match(/:root\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? '';
const darkBlock = css.match(/\.dark\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? '';
const authPages = ['Login', 'Register', 'ForgotPassword', 'ResetPassword'].map((name) => ({
  name,
  source: fs.readFileSync(path.join(cwd(), `src/pages/auth/${name}.jsx`), 'utf8'),
}));

describe('Discord-inspired theme contract', () => {
  it('uses the approved open-source typography and removes the editorial serif', () => {
    expect(css).toContain('Hanken+Grotesk');
    expect(rootBlock).toContain("--font-display: 'Hanken Grotesk'");
    expect(rootBlock).toContain("--font-sans: 'Inter'");
    expect(css).not.toContain('EB Garamond');
  });

  it('defines the light Discord palette', () => {
    expect(rootBlock).toContain('--bg-primary: #f3f4ff;');
    expect(rootBlock).toContain('--bg-card: #ffffff;');
    expect(rootBlock).toContain('--text-primary: #1e1f22;');
    expect(rootBlock).toContain('--accent-color: #5865f2;');
    expect(rootBlock).toContain('--intent-color: #35ed7e;');
    expect(rootBlock).toContain('--accent-magenta: #d83fac;');
  });

  it('defines the canonical dark Discord palette', () => {
    expect(darkBlock).toContain('--bg-primary: #0a0d3a;');
    expect(darkBlock).toContain('--bg-card: #1e2353;');
    expect(darkBlock).toContain('--bg-onyx: #23272a;');
    expect(darkBlock).toContain('--text-primary: #ffffff;');
    expect(darkBlock).toContain('--accent-color: #5865f2;');
    expect(darkBlock).toContain('--accent-magenta: #ec48bd;');
  });

  it('includes reduced-motion protection and no ElevenLabs palette', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).not.toContain('#f5f5f5');
    expect(css).not.toContain('#0c0a09');
    expect(css).not.toContain('--gradient-mint');
    expect(css).not.toContain('--gradient-peach');
  });

  it('loads the shared auth shell styles on every public auth route', () => {
    authPages.forEach(({ name, source }) => {
      expect(source, `${name} must load auth.css`).toContain("import './auth.css';");
    });
  });
});
