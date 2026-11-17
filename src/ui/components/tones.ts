/** Background tones of the «Bloques» theme: one per topic, plus neutral and highlight. */
export type Tone = 'paper' | 'sun' | 'flags' | 'capitals' | 'shapes';

export const toneClasses: Record<Tone, string> = {
  paper: 'bg-paper',
  sun: 'bg-sun',
  flags: 'bg-topic-flags',
  capitals: 'bg-topic-capitals',
  shapes: 'bg-topic-shapes',
};
