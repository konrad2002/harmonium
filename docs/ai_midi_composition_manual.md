# Writing music for the harmonium as MIDI (instructions for AI agents)

This document tells you how to create a **MIDI file that the Eitz Harmonium app can import** (Compose view → "Import MIDI"). Follow it exactly: the instrument is *not* tuned in 12-tone equal temperament, so a normal MIDI file will not sound or import correctly.

Everything you need is in this file: the pitch table, the encoding rules and a ready-to-run script. Do not guess pitches; take them from the table in section 3.

---

## 1. How the instrument works

* The harmonium plays **just intonation** (5-limit). A tone is a letter plus a *comma level*: `c°` is the plain tone, `c+1` is 1 syntonic comma higher (+21.6 cents), `c-1` is 1 comma lower (−21.6 cents), `c-2` is 2 commas lower.
* Names are German: `h` = B natural, `b` = B flat, `es` = E flat, `as` = A flat, `cis` = C sharp, `cisis` = C double sharp, `eis` = E sharp, and so on.
* The manual has four **colours** of keys. Each colour is tuned to one comma level, so the same note exists in several slightly different versions:

| Colour | Default register | Comma level | Typical use |
| :--- | :--- | :--- | :--- |
| yellow | IV | `°` (0, Pythagorean) | roots and fifths |
| blue | III | `+1` (+21.6 cents) | pure **minor** thirds above a yellow root |
| red | V | `-1` (−21.6 cents) | pure **major** thirds and sevenths above a yellow root |
| white | VI | `-2` (−43.2 cents) | special colours, low comma levels |

* Several keys can sound at once (polyphony). The instrument has **no velocity** and no sustain pedal; a note sounds from Note On to Note Off.
* The file is written for the **default register selection: III, IV, V and VI active** (one register per colour). Notes that no active register can play are dropped on import. Registers I, II, VII (empty) and VIII (yellow, very low comma level) are not covered here.

---

## 2. MIDI file rules (must all be met)

1. **Standard MIDI File**, format 1 (format 0 also works). Any ticks-per-quarter value is accepted; **480** at **120 BPM** is recommended (1 second = 960 ticks). Tempo changes are respected on import.
2. **One MIDI channel per sounding note** (channels 1–16, i.e. `0x0`–`0xF`). At most **16 notes may sound at the same time**. A channel may be reused once its note has ended.
3. **Send a Pitch Bend message on the note's channel before (or in the same tick as, but ahead of) its Note On.** Use the bend value from section 3, even when it is 0.
4. **Pitch bend range = ±200 cents.** Encode the bend with this exact formula (14-bit value `V`, `Δ` = bend in cents):

   `V = clamp(round(8192 + Δ / 200 × 8191), 0, 16383)`  
   `LSB = V & 0x7F`, `MSB = (V >> 7) & 0x7F`, message bytes: `0xE0+channel, LSB, MSB`

   Examples: `Δ = 0` → `E0 00 40`; `Δ = +8.0` → `V = 8520` → `E0 48 42`; `Δ = −13.6` → `V = 7635` → `E0 53 3B`.
5. Optional but recommended: at tick 0 on every used channel set the bend range to ±2 semitones with RPN 0: `B0 65 00`, `B0 64 00`, `B0 06 02`, `B0 26 00`, then RPN null `B0 65 7F`, `B0 64 7F`. (The app ignores these; other MPE synths need them.)
6. Note On velocity: any value 1–127 (use 64). Note Off: `0x80+channel`, note, velocity 0.
7. **Timing:** use multiples of **0.125 s** (120 ticks at 480 PPQ / 120 BPM) for note starts and lengths. The editor snaps to this grid, so such notes stay easy to edit. Shortest useful note: 0.125 s.
8. Do not use channel-specific tricks (program changes, drums on channel 10, controllers) – they are ignored.

---

## 3. Pitch table: which note + bend sounds which tone

A note is identified by its **MIDI note number** and the **bend in cents** (section 2, rule 4). The app computes the pitch as

`pitch in cents = (note − 36) × 100 + bend`

and plays the key whose tone is closest (it must be within 30 cents). **So always use the exact note/bend pairs below.** A different bend selects a different tone, or no key at all.

MIDI note 60 = middle C (C4). The lowest available note is 39 (D#2), the highest 108 (C8).

How to read the table: pick a tone, take its bend, and use any of the listed MIDI notes (each is one octave apart).

| Register | Tone | Bend (cents) | MIDI notes |
| :--- | :--- | ---: | :--- |
| III blue | ces+1 | +7.6 | 59, 71, 83, 95 |
| III blue | c+1 | +21.6 | 48, 60, 72, 84 |
| III blue | des+1 | +11.6 | 49, 61, 73, 85 |
| III blue | d+1 | +25.6 | 50, 62, 74, 86 |
| III blue | es+1 | +15.6 | 39, 51, 63, 75, 87 |
| III blue | e+1 | +29.6 | 40, 52, 64, 76, 88 |
| III blue | f+1 | +19.6 | 41, 53, 65, 77, 89 |
| III blue | ges+1 | +9.6 | 42, 54, 66, 78, 90 |
| III blue | g+1 | +23.6 | 43, 55, 67, 79, 91 |
| III blue | as+1 | +13.6 | 44, 56, 68, 80, 92 |
| III blue | a+1 | +27.6 | 45, 57, 69, 81, 93 |
| III blue | b+1 | +17.6 | 58, 70, 82, 94, 106 |
| III blue | h+1 | +31.6 | 59, 71, 83, 95, 107 |
| IV yellow | c° | +0.0 | 48, 60, 72, 84, 96 |
| IV yellow | cis° | +14.0 | 49, 61, 73, 85 |
| IV yellow | d° | +4.0 | 50, 62, 74, 86 |
| IV yellow | es° | −6.0 | 51, 63, 75, 87 |
| IV yellow | e° | +8.0 | 52, 64, 76, 88 |
| IV yellow | f° | −2.0 | 41, 53, 65, 77, 89 |
| IV yellow | fis° | +12.0 | 42, 54, 66, 78, 90 |
| IV yellow | g° | +2.0 | 43, 55, 67, 79, 91 |
| IV yellow | gis° | +16.0 | 44, 56, 68, 80, 92 |
| IV yellow | as° | −8.0 | 44, 56, 68, 80, 92 |
| IV yellow | a° | +6.0 | 45, 57, 69, 81, 93 |
| IV yellow | b° | −4.0 | 46, 58, 70, 82, 94 |
| IV yellow | h° | +10.0 | 47, 59, 71, 83, 95 |
| V red | c-1 | −21.6 | 60, 72, 84, 96, 108 |
| V red | cis-1 | −7.6 | 49, 61, 73, 85 |
| V red | d-1 | −17.6 | 50, 62, 74, 86 |
| V red | dis-1 | −3.6 | 51, 63, 75, 87 |
| V red | e-1 | −13.6 | 52, 64, 76, 88 |
| V red | eis-1 | +0.4 | 41, 53, 65, 77, 89 |
| V red | f-1 | −23.6 | 41, 53, 65, 77, 89 |
| V red | fis-1 | −9.6 | 42, 54, 66, 78, 90 |
| V red | g-1 | −19.6 | 43, 55, 67, 79, 91 |
| V red | gis-1 | −5.6 | 44, 56, 68, 80, 92 |
| V red | a-1 | −15.6 | 45, 57, 69, 81, 93 |
| V red | ais-1 | −1.6 | 46, 58, 70, 82, 94 |
| V red | h-1 | −11.6 | 47, 59, 71, 83, 95 |
| VI white | cis-2 | −29.2 | 49, 61, 73, 85 |
| VI white | cisis-2 | −15.2 | 50, 62, 74, 86 |
| VI white | d-2 | −39.2 | 50, 62, 74, 86 |
| VI white | dis-2 | −25.2 | 51, 63, 75, 87 |
| VI white | e-2 | −35.2 | 52, 64, 76, 88 |
| VI white | eis-2 | −21.2 | 41, 53, 65, 77, 89 |
| VI white | fis-2 | −31.2 | 42, 54, 66, 78, 90 |
| VI white | fisis-2 | −17.2 | 43, 55, 67, 79, 91 |
| VI white | gis-2 | −27.2 | 44, 56, 68, 80, 92 |
| VI white | a-2 | −37.2 | 45, 57, 69, 81, 93 |
| VI white | ais-2 | −23.2 | 46, 58, 70, 82, 94 |
| VI white | h-2 | −33.2 | 47, 59, 71, 83, 95 |
| VI white | his-2 | −19.2 | 48, 60, 72, 84, 96 |

(`His-2` sounds at the pitch of a C, `ces+1` at the pitch of a B, etc. – the MIDI note number is simply the nearest semitone of the tone's pitch.)

Typical working range: **MIDI 41–95** (F2–B6) for all four colours. Yellow, red and white also reach 96, blue also reaches 39–40 and 106–107, red also 108, but blue has no notes 46–47 and 96–105.

---

## 4. Composing in just intonation

Tune chords to the colours; this is what makes the instrument sound right. Take a **yellow root** `X°` and add:

| Interval above the root | Use |
| :--- | :--- |
| pure major third (5:4) | **red**, the third's letter with `-1` (e.g. root `c°` → `e-1`) |
| pure minor third (6:5) | **blue**, the third's letter with `+1` (e.g. root `c°` → `es+1`) |
| perfect fifth (3:2) | **yellow**, `°` (root `c°` → `g°`) |
| pure major seventh (15:8) | **red**, `-1` (root `c°` → `h-1`) |
| octave | the same tone, MIDI note + 12 |

Check with the table: C major triad = `c°` (note 60, +0.0) + `e-1` (note 64, −13.6) + `g°` (note 67, +2.0). C minor triad = `c°` (60, +0.0) + `es+1` (63, +15.6) + `g°` (67, +2.0).

Practical tips:

* Keep the melody mostly in one colour (yellow is the safest), and use red/blue for chord thirds.
* Avoid more than 16 simultaneous notes, and avoid very fast notes (below 0.125 s).
* Use the sustained, organ-like character: long chords, slow-moving voices and legato lines suit the instrument.
* If you stay in **one register's tone list only** the music never leaves that comma level; mixing colours is what changes the tuning on purpose.

---

## 5. Script that writes the file (Python 3, standard library only)

Fill in `NOTES` with dictionaries `start` (seconds), `duration` (seconds), `note` (MIDI note from the table) and `bend` (cents from the table), then run the script. It allocates channels, writes the pitch bends and the bend-range setup, and creates `composition.mid`.

```python
#!/usr/bin/env python3
"""Writes a ReinharMIDIum MIDI file (Python 3, standard library only)."""
import struct

TPQ = 480                    # ticks per quarter note
TEMPO = 500000               # microseconds per quarter note = 120 bpm -> 960 ticks per second
TICKS_PER_SECOND = 960
CHANNELS = 16


def bend_value(cents):
    """14-bit pitch bend value for a deviation in cents (range +-200 cents)."""
    return max(0, min(16383, round(8192 + cents / 200 * 8191)))


def var_len(n):
    out = [n & 0x7F]
    n >>= 7
    while n:
        out.insert(0, (n & 0x7F) | 0x80)
        n >>= 7
    return bytes(out)


def track(events):
    """events: list of (tick, order, bytes). Sorted by tick, then order."""
    body, last = b"", 0
    for tick, _, data in sorted(events, key=lambda e: (e[0], e[1])):
        body += var_len(tick - last) + data
        last = tick
    body += b"\x00\xff\x2f\x00"
    return b"MTrk" + struct.pack(">I", len(body)) + body


def write_midi(path, notes):
    """notes: list of dicts {start, duration, note, bend}; seconds, MIDI note number, cents."""
    free_at = [-1] * CHANNELS
    last = CHANNELS - 1
    used, events = set(), []

    for n in sorted(notes, key=lambda n: (n["start"], n["note"])):
        start = round(n["start"] * TICKS_PER_SECOND)
        end = max(start + 1, round((n["start"] + n["duration"]) * TICKS_PER_SECOND))
        # Every sounding note needs its own channel; rotate to reuse channels as late as possible
        channel = next((c for c in ((last + i) % CHANNELS for i in range(1, CHANNELS + 1))
                        if free_at[c] <= start), None)
        if channel is None:
            raise ValueError(f"more than 16 simultaneous notes at {n['start']} s")
        free_at[channel], last = end, channel
        used.add(channel)

        value = bend_value(n.get("bend", 0.0))
        events.append((start, 2, bytes([0xE0 | channel, value & 0x7F, value >> 7])))       # pitch bend first
        events.append((start, 3, bytes([0x90 | channel, n["note"], 64])))                   # note on
        events.append((end, 1, bytes([0x80 | channel, n["note"], 0])))                      # note off

    for channel in used:  # bend range +-2 semitones (RPN 0), then RPN null
        for controller, value in ((101, 0), (100, 0), (6, 2), (38, 0), (101, 127), (100, 127)):
            events.append((0, 0, bytes([0xB0 | channel, controller, value])))

    meta = [(0, 0, b"\xff\x51\x03" + TEMPO.to_bytes(3, "big"))]
    header = b"MThd" + struct.pack(">IHHH", 6, 1, 2, TPQ)
    with open(path, "wb") as f:
        f.write(header + track(meta) + track(events))


# Values come from the pitch table: MIDI note and bend in cents
NOTES = [
    {"start": 0.0, "duration": 0.5, "note": 48, "bend": 0.0},     # yellow c°
    {"start": 0.5, "duration": 0.5, "note": 52, "bend": 8.0},     # yellow e°
    {"start": 1.0, "duration": 1.0, "note": 55, "bend": 2.0},     # yellow g°
    {"start": 1.0, "duration": 1.0, "note": 52, "bend": -13.6},   # red e-1 (sounds together)
]

if __name__ == "__main__":
    write_midi("composition.mid", NOTES)
```

If you cannot run code, output the completed script (or just the `NOTES` list) and ask the user to run it.

If you write the file with a library such as `mido` instead: use `ticks_per_beat=480`, a tempo of 500000, `pitchwheel` messages with `pitch = V − 8192` (mido's pitch is signed), one channel per note, and the pitch bend before the `note_on`.

---

## 6. Checklist before you deliver the file

* [ ] Every note uses a **MIDI note + bend pair that appears in the table** (same row, a listed note number).
* [ ] A pitch bend precedes each Note On on the same channel, and each sounding note has its own channel.
* [ ] No more than 16 notes sound at once; note lengths and starts are multiples of 0.125 s.
* [ ] All notes lie between MIDI 41 and 95 unless you deliberately use the extreme notes.
* [ ] Chords are tuned with the colours from section 4.
* [ ] The file ends cleanly: every Note On has a Note Off.

## 7. What happens on import

* Each note's pitch is `(note − 36) × 100 + bend` cents. The key with the closest tone (within 30 cents) is used; notes without such a key are skipped and the app reports how many.
* The imported notes **replace the current composition** (the app asks first), and can then be played and edited in the Compose view.
* The file is interpreted with the *currently active registers*. If the user changed the registers, pitches may map to different keys or be skipped.
* A plain 12-tone file without pitch bends also imports, but its notes snap to the nearest available tone, which can be up to ~25 cents away from the intended pitch. Use the bends from the table for correct tuning.
