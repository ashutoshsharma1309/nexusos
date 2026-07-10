'use client';

import { FileCode2, FilePlus2, Play } from 'lucide-react';
import { LANGUAGES } from './languages';
import { createCodeFile } from './createFile';

/** Languages offered as one-click starters, each producing a named file + template. */
const STARTERS: { ext: keyof typeof LANGUAGES | string; file: string }[] = [
  { ext: 'py', file: 'main.py' },
  { ext: 'c', file: 'main.c' },
  { ext: 'cpp', file: 'main.cpp' },
  { ext: 'js', file: 'main.js' },
  { ext: 'ts', file: 'main.ts' },
];

interface Props {
  onCreated: (id: string) => void;
}

/** The Code app's home screen: pick a language and start writing immediately —
 *  no Explorer, no dialogs. */
export function NewFileScreen({ onCreated }: Props) {
  const create = async (name: string, template: string) => onCreated(await createCodeFile(name, template));

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent/40">
          <FileCode2 className="h-7 w-7 text-accent-fg" />
        </div>
        <h2 className="text-lg font-semibold text-fg">Create a new file</h2>
        <p className="text-sm text-fg-muted">Choose a language to start writing — you can run it right here.</p>
      </div>

      <div className="grid w-full max-w-md grid-cols-2 gap-2.5 sm:grid-cols-3">
        {STARTERS.map(({ ext, file }) => {
          const lang = LANGUAGES[ext];
          if (!lang) return null;
          return (
            <button
              key={file}
              type="button"
              onClick={() => create(file, lang.template)}
              className="group flex flex-col items-start gap-2 rounded-xl border border-border/[0.06] bg-fg/[0.03] p-3 text-left transition-colors hover:border-border/15 hover:bg-fg/[0.06]"
            >
              <span className="flex w-full items-center justify-between">
                <FileCode2 className="h-5 w-5" style={{ color: `rgb(${lang.tint})` }} />
                {lang.runnable && <Play className="h-3 w-3 fill-success text-success opacity-0 transition-opacity group-hover:opacity-100" />}
              </span>
              <span className="text-sm font-medium text-fg">{lang.label}</span>
              <span className="font-mono text-2xs text-fg-muted">{file}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => create('untitled.txt', '')}
          className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-border/10 bg-transparent p-3 text-left transition-colors hover:border-border/25 hover:bg-fg/[0.04]"
        >
          <FilePlus2 className="h-5 w-5 text-fg-muted" />
          <span className="text-sm font-medium text-fg">Blank file</span>
          <span className="font-mono text-2xs text-fg-muted">untitled.txt</span>
        </button>
      </div>
    </div>
  );
}
