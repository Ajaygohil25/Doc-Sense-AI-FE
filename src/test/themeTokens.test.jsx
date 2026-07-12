import fs from 'node:fs';
import path from 'node:path';
import { cwd } from 'node:process';
import { describe, expect, it } from 'vitest';

const css = fs.readFileSync(path.join(cwd(), 'src/index.css'), 'utf8');
const appCss = fs.readFileSync(path.join(cwd(), 'src/App.css'), 'utf8');
const rootBlock = css.match(/:root\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? '';
const darkBlock = css.match(/\.dark\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? '';

const readHexToken = (block, token) => (
  block.match(new RegExp(`${token}:\\s*(#[0-9a-fA-F]{6})`))?.[1]
);

const relativeLuminance = (hex) => {
  const channels = hex.slice(1).match(/.{2}/g).map((value) => parseInt(value, 16) / 255);
  const linear = channels.map((value) => (
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  ));

  return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2]);
};

const contrastRatio = (foreground, background) => {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
};

const readUiSources = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const entryPath = path.join(directory, entry.name);
  if (entry.isDirectory()) {
    return entry.name === 'test' ? [] : readUiSources(entryPath);
  }
  return /\.(css|jsx)$/.test(entry.name) ? [fs.readFileSync(entryPath, 'utf8')] : [];
});

const productionUiSource = readUiSources(path.join(cwd(), 'src')).join('\n');
const authPages = ['Login', 'Register', 'ForgotPassword', 'ResetPassword'].map((name) => ({
  name,
  source: fs.readFileSync(path.join(cwd(), `src/pages/auth/${name}.jsx`), 'utf8'),
}));

describe('restrained product theme contract', () => {
  it('uses Inter throughout without a separate display font', () => {
    expect(css).toContain('family=Inter:wght@400;500;600;700');
    expect(rootBlock).toContain("--font-sans: 'Inter'");
    expect(rootBlock).toContain("--font-display: 'Inter'");
    expect(css).not.toContain('Hanken Grotesk');
  });

  it('defines the restrained light palette', () => {
    expect(rootBlock).toContain('--bg-primary: #f6f7f9;');
    expect(rootBlock).toContain('--bg-card: #ffffff;');
    expect(rootBlock).toContain('--text-primary: #20242c;');
    expect(rootBlock).toContain('--text-secondary: #69717d;');
    expect(rootBlock).toContain('--border-color: #e1e4e8;');
    expect(rootBlock).toContain('--accent-color: #56658f;');
  });

  it('defines the restrained dark palette', () => {
    expect(darkBlock).toContain('--bg-primary: #17191e;');
    expect(darkBlock).toContain('--bg-card: #20232a;');
    expect(darkBlock).toContain('--text-primary: #f1f3f5;');
    expect(darkBlock).toContain('--text-secondary: #a8afb9;');
    expect(darkBlock).toContain('--border-color: #343943;');
    expect(darkBlock).toContain('--accent-color: #8190ba;');
  });

  it('keeps user-message foreground and accent colors AA compliant in both themes', () => {
    expect(contrastRatio(
      readHexToken(rootBlock, '--on-accent'),
      readHexToken(rootBlock, '--accent-color'),
    )).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(
      readHexToken(darkBlock, '--on-accent'),
      readHexToken(darkBlock, '--accent-color'),
    )).toBeGreaterThanOrEqual(4.5);
  });

  it('uses the dynamic viewport and removes hidden-sidebar space from chat routes', () => {
    expect(appCss).toMatch(/\.app-container\.chat-layout\s*\{[^}]*height: 100vh;[^}]*height: 100dvh;/s);
    expect(appCss).toMatch(/\.app-container\.chat-layout \.main-content\s*\{[^}]*width: 100%;[^}]*padding-left: 0;/s);
  });

  it('uses compact geometry and retains reduced-motion protection', () => {
    expect(rootBlock).toContain('--border-radius-xxl: 16px;');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('removes vibrant and implementation-specific visual hooks', () => {
    expect(productionUiSource).not.toMatch(/linear-gradient|radial-gradient/);
    expect(productionUiSource).not.toMatch(/--mesh-|accent-magenta|intent-color|accent-glow/);
    expect(productionUiSource).not.toMatch(/discord-|btn-intent/);
    expect(productionUiSource).not.toContain('text-transform: uppercase');
  });

  it('loads the shared auth shell styles on every public auth route', () => {
    authPages.forEach(({ name, source }) => {
      expect(source, `${name} must load auth.css`).toContain("import './auth.css';");
    });
  });
});
