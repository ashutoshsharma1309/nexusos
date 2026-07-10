'use client';

import { useState } from 'react';
import { Contrast, Palette, Sparkles, Zap, Eye } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useSettingsStore, THEMES, THEME_LABELS, type ThemeId } from './store';

const ACCENTS: { label: string; rgb: string }[] = [
  { label: 'Indigo', rgb: '99 132 255' },
  { label: 'Violet', rgb: '168 122 255' },
  { label: 'Pink', rgb: '244 114 182' },
  { label: 'Emerald', rgb: '52 211 153' },
  { label: 'Amber', rgb: '251 191 36' },
  { label: 'Sky', rgb: '56 189 248' },
  { label: 'Rose', rgb: '251 113 133' },
];

const SECTIONS = ['Appearance', 'Accessibility'] as const;
type Section = (typeof SECTIONS)[number];

function ThemeSwatch({ id, active, onClick }: { id: ThemeId; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-theme={id}
      className={cn(
        'group relative overflow-hidden rounded-xl border p-3 text-left transition-all',
        active ? 'border-accent ring-2 ring-accent/50' : 'border-border/10 hover:border-border/25',
      )}
      style={{ background: 'rgb(var(--color-surface))' }}
    >
      <div className="mb-2 flex gap-1">
        {['--color-accent', '--color-success', '--color-warning', '--color-danger'].map((v) => (
          <span key={v} className="h-4 w-4 rounded-full" style={{ background: `rgb(var(${v}))` }} />
        ))}
      </div>
      <span className="text-xs font-medium" style={{ color: 'rgb(var(--color-fg))' }}>
        {THEME_LABELS[id]}
      </span>
    </button>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-10 shrink-0 rounded-full transition-colors',
        checked ? 'bg-accent' : 'bg-fg/15',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

function Row({ icon: Icon, title, desc, children }: { icon: typeof Zap; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-fg/5 p-3.5">
      <Icon className="h-5 w-5 shrink-0 text-accent" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg">{title}</p>
        <p className="text-xs text-fg-muted">{desc}</p>
      </div>
      {children}
    </div>
  );
}

/** Settings app: appearance (theme, accent) and accessibility (motion, contrast, transparency). */
export default function Settings() {
  const s = useSettingsStore();
  const [section, setSection] = useState<Section>('Appearance');

  return (
    <div className="flex h-full">
      <nav className="w-44 shrink-0 border-r border-border/5 p-3">
        {SECTIONS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setSection(item)}
            className={cn(
              'mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
              section === item ? 'bg-accent/20 text-fg' : 'text-fg-muted hover:bg-fg/5',
            )}
          >
            {item === 'Appearance' ? <Palette className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {item}
          </button>
        ))}
      </nav>

      <div className="min-w-0 flex-1 overflow-y-auto p-5">
        {section === 'Appearance' && (
          <div className="space-y-6">
            <section>
              <h3 className="mb-3 text-sm font-semibold text-fg">Theme</h3>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {THEMES.map((t) => (
                  <ThemeSwatch key={t} id={t} active={s.theme === t} onClick={() => s.setTheme(t)} />
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-fg">Accent Color</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => s.setAccent(null)}
                  className={cn(
                    'flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs transition-colors',
                    s.accent === null ? 'border-accent text-fg' : 'border-border/10 text-fg-muted',
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5" /> Theme default
                </button>
                {ACCENTS.map((a) => (
                  <button
                    key={a.rgb}
                    type="button"
                    aria-label={a.label}
                    onClick={() => s.setAccent(a.rgb)}
                    className={cn(
                      'h-9 w-9 rounded-lg border-2 transition-transform hover:scale-105',
                      s.accent === a.rgb ? 'border-fg' : 'border-transparent',
                    )}
                    style={{ background: `rgb(${a.rgb})` }}
                  />
                ))}
              </div>
            </section>
          </div>
        )}

        {section === 'Accessibility' && (
          <div className="space-y-3">
            <Row icon={Zap} title="Reduce motion" desc="Minimize animations across the system">
              <Toggle
                label="Reduce motion"
                checked={s.motion === 'reduced'}
                onChange={(v) => s.setMotion(v ? 'reduced' : 'full')}
              />
            </Row>
            <Row icon={Contrast} title="High contrast" desc="Increase border and text contrast">
              <Toggle
                label="High contrast"
                checked={s.contrast === 'high'}
                onChange={(v) => s.setContrast(v ? 'high' : 'normal')}
              />
            </Row>
            <Row icon={Eye} title="Reduce transparency" desc="Make glass surfaces more opaque">
              <Toggle
                label="Reduce transparency"
                checked={s.reduceTransparency}
                onChange={s.setReduceTransparency}
              />
            </Row>
          </div>
        )}
      </div>
    </div>
  );
}
