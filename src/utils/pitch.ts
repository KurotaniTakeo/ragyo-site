/**
 * 音高（MIDI 编号）与音名的换算。
 *
 * 只涉及固定音乐术语（C / C# / …），四种语言一致，故按约定放在这里而不进 i18n。
 */

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

/**
 * MIDI 编号转科学音高记号：60 → C4、36 → C2、71 → B4。
 * 超出 0–127 的输入先 clamp，避免越界取到 undefined。
 */
export function midiToNoteName(midi: number): string {
  const value = Math.max(0, Math.min(127, Math.round(midi)))
  const name = NOTE_NAMES[value % 12]
  const octave = Math.floor(value / 12) - 1
  return `${name}${octave}`
}
