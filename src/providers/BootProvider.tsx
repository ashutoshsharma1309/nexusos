'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { ensureFilesystem } from '@/services/filesystem';
import { useSettingsStore } from '@/features/settings/store';
import { notify } from '@/features/notifications/store';

/** Seeds the virtual filesystem and shows a brief boot splash until data is ready. */
export function BootProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useSettingsStore((s) => s.hydrated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      await ensureFilesystem();
      if (!active) return;
      setReady(true);
      // Welcome notification appears once the desktop is live.
      window.setTimeout(() => {
        notify({
          title: 'Welcome to Nexus OS',
          body: 'Press ⌘K to open the command palette.',
          tone: 'info',
        });
      }, 1200);
    })();
    return () => {
      active = false;
    };
  }, []);

  const booted = ready && hydrated;

  return (
    <>
      <AnimatePresence>
        {!booted && (
          <motion.div
            key="boot"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-boot flex flex-col items-center justify-center gap-6 bg-bg"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent/40"
            >
              <Sparkles className="h-8 w-8 text-accent-fg" />
            </motion.div>
            <div className="h-1 w-40 overflow-hidden rounded-full bg-fg/10">
              <motion.div
                className="h-full w-1/2 rounded-full bg-accent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {booted && children}
    </>
  );
}
