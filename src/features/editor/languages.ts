/** Language metadata keyed by file extension: display label, an icon tint, whether
 *  the local runtime can execute it, and a starter template inserted into new,
 *  empty files (mirrors VS Code's "new file" scaffolding). */
export interface Language {
  id: string;
  label: string;
  /** RGB triple for the file-type glyph. */
  tint: string;
  runnable: boolean;
  template: string;
}

export const LANGUAGES: Record<string, Language> = {
  c: {
    id: 'c',
    label: 'C',
    tint: '89 148 220',
    runnable: true,
    template: '#include <stdio.h>\n\nint main(void) {\n    printf("Hello, Nexus!\\n");\n    return 0;\n}\n',
  },
  cpp: {
    id: 'cpp',
    label: 'C++',
    tint: '0 122 204',
    runnable: true,
    template:
      '#include <iostream>\n\nint main() {\n    std::cout << "Hello, Nexus!" << std::endl;\n    return 0;\n}\n',
  },
  cc: { id: 'cpp', label: 'C++', tint: '0 122 204', runnable: true, template: '' },
  py: {
    id: 'python',
    label: 'Python',
    tint: '255 212 59',
    runnable: true,
    template: 'def main():\n    print("Hello, Nexus!")\n\n\nmain()\n',
  },
  js: {
    id: 'javascript',
    label: 'JavaScript',
    tint: '247 223 30',
    runnable: true,
    template: 'console.log("Hello, Nexus!");\n',
  },
  mjs: { id: 'javascript', label: 'JavaScript', tint: '247 223 30', runnable: true, template: '' },
  ts: {
    id: 'typescript',
    label: 'TypeScript',
    tint: '49 120 198',
    runnable: true,
    template: 'const greet = (name: string): void => console.log(`Hello, ${name}!`);\ngreet("Nexus");\n',
  },
  json: { id: 'json', label: 'JSON', tint: '203 153 30', runnable: false, template: '{\n  \n}\n' },
  md: { id: 'markdown', label: 'Markdown', tint: '120 160 255', runnable: false, template: '# Title\n\n' },
  css: { id: 'css', label: 'CSS', tint: '86 156 214', runnable: false, template: '' },
  html: { id: 'html', label: 'HTML', tint: '227 79 38', runnable: false, template: '' },
  txt: { id: 'text', label: 'Plain Text', tint: '148 154 176', runnable: false, template: '' },
};

export function extensionOf(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

export function languageFor(name: string): Language {
  return LANGUAGES[extensionOf(name)] ?? LANGUAGES.txt!;
}
