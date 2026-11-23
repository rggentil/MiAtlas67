import { useI18n } from '../../i18n/context.ts';
import { useSound } from '../../sound/context.ts';
import { SoundOffIcon, SoundOnIcon } from './icons.tsx';

/**
 * The switch «Sonido» (SET-02, D35): a screen reader hears its name and whether it is on; the speaker icon,
 * with waves or crossed out, shows it besides the colour (NFR-05).
 */
export function SoundSwitch() {
  const { t } = useI18n();
  const { soundOn, setSoundOn } = useSound();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={soundOn}
      onClick={() => {
        setSoundOn(!soundOn);
      }}
      className={[
        'inline-flex min-h-12 min-w-12 items-center justify-center gap-2 px-4',
        'rounded-full border-3 border-ink font-black shadow-block-sm',
        'motion-safe:transition-[translate,box-shadow] motion-safe:duration-75',
        'active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
        'focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent',
        soundOn ? 'bg-sun' : 'bg-paper',
      ].join(' ')}
    >
      {soundOn ? <SoundOnIcon size={20} /> : <SoundOffIcon size={20} />}
      {t('settings.sound')}
    </button>
  );
}
