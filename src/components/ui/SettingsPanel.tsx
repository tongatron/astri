import { useEffect, useState } from 'react';
import { useStore, type NotificationCategory } from '@/state/store';
import {
  permissionState,
  requestNotificationPermission,
  isNotificationSupported,
} from '@/core/notifications/scheduler';

const CATEGORY_META: {
  key: NotificationCategory;
  label: string;
  description: string;
}[] = [
  {
    key: 'bestNight',
    label: 'Notti ottime',
    description: 'Quando stasera ha condizioni favorevoli (cielo terso, Luna gestibile).',
  },
  {
    key: 'moonPhase',
    label: 'Fasi lunari notabili',
    description: 'Luna piena e Luna nuova.',
  },
  {
    key: 'astroEvent',
    label: 'Eventi astronomici',
    description: 'Congiunzioni, eclissi, piogge di meteore in corso.',
  },
  {
    key: 'issPass',
    label: 'Passaggi ISS visibili',
    description: 'Stazione Spaziale Internazionale visibile dalla tua posizione (sperimentale).',
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SettingsPanel({ open, onClose }: Props) {
  const notifications = useStore((s) => s.notifications);
  const setEnabled = useStore((s) => s.setNotificationsEnabled);
  const setCategory = useStore((s) => s.setNotificationCategory);

  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>(
    permissionState(),
  );

  useEffect(() => {
    if (open) setPerm(permissionState());
  }, [open]);

  if (!open) return null;

  const onToggleMaster = async (next: boolean) => {
    if (next && perm !== 'granted') {
      const result = await requestNotificationPermission();
      setPerm(result);
      if (result !== 'granted') {
        setEnabled(false);
        return;
      }
    }
    setEnabled(next);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-night-950/80 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-night-700 bg-night-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">Impostazioni</h2>
            <p className="mt-1 text-xs text-night-400">
              Astri ti avvisa quando apri l'app: le notifiche reali (a app chiusa)
              richiedono un backend non disponibile su GitHub Pages.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-night-700 px-2 py-0.5 text-xs text-night-300 hover:bg-night-800"
          >
            ✕
          </button>
        </div>

        <section className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Notifiche</h3>
              <p className="text-[11px] text-night-400">
                {perm === 'unsupported'
                  ? 'Browser non supportato.'
                  : perm === 'denied'
                    ? 'Permessi negati nelle impostazioni del browser.'
                    : perm === 'granted'
                      ? 'Permessi concessi.'
                      : 'Permessi non ancora richiesti.'}
              </p>
            </div>
            <Toggle
              checked={notifications.enabled && perm === 'granted'}
              onChange={onToggleMaster}
              disabled={perm === 'unsupported' || perm === 'denied'}
            />
          </div>

          <div
            className={`mt-4 space-y-3 ${
              notifications.enabled && perm === 'granted' ? '' : 'pointer-events-none opacity-40'
            }`}
          >
            {CATEGORY_META.map((c) => (
              <label
                key={c.key}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-night-800/70 bg-night-950/50 p-3 hover:border-night-700"
              >
                <input
                  type="checkbox"
                  checked={notifications.categories[c.key]}
                  onChange={(e) => setCategory(c.key, e.target.checked)}
                  className="mt-0.5 size-4 accent-sun"
                />
                <div>
                  <div className="text-sm font-medium text-slate-100">{c.label}</div>
                  <div className="text-[11px] text-night-400">{c.description}</div>
                </div>
              </label>
            ))}
          </div>

          {isNotificationSupported() && perm === 'denied' && (
            <p className="mt-3 text-[11px] text-amber-400">
              Riapri i permessi del sito nelle impostazioni del browser per attivare le notifiche.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (b: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      aria-pressed={checked}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        disabled
          ? 'cursor-not-allowed bg-night-800'
          : checked
            ? 'bg-sun'
            : 'bg-night-700'
      }`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-night-950 shadow transition ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}
