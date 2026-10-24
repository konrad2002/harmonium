# ReinharMIDIum MIDI Implementation Specification

This document provides technical specifications for encoding, storing, and generating MIDI data for the **ReinharMIDIum** (a microtonal virtual instrument based on the Carl Eitz Reinharmonium). Coding agents should follow these rules when generating MIDI sequences, songs, or drivers for this instrument.

---

## 1. Core Architecture Overview

Standard MIDI 1.0 Note On messages assign pitches in semitone increments (12-Tone Equal Temperament). To produce 5-limit just intonation pitches across multiple comma levels, the ReinharMIDIum utilizes **MIDI Polyphonic Expression (MPE)** concepts:

1. **Per-Note Channel Allocation:** Each sounding note is assigned its own dedicated MIDI channel (Channels 1 through 16).
2. **Channel-Wide Pitch Bends:** Microtonal adjustments are applied via 14-bit MIDI Pitch Bend messages (`0xE0`–`0xEF`) sent on the note's assigned channel **prior to or simultaneously with** the `Note On` event.
3. **MPE Compatibility:** Synthesizers or VSTs playing ReinharMIDIum MIDI streams must have MPE enabled (or be configured in a multi-channel/multimbral arrangement) so channel pitch bends apply independently per voice.

---

## 2. Note & Base Frequency Mapping

Keys on the ReinharMIDIum keyboard are arranged in 12 chromatic columns. Every column maps to a base MIDI Note Number.

### Column to Base MIDI Note Mapping

| Column Index | Note Name | Base MIDI Note Number |
| :--- | :--- | :--- |
| **0** | C | `60` |
| **1** | C# / Db | `61` |
| **2** | D | `62` |
| **3** | D# / Eb | `63` |
| **4** | E | `64` |
| **5** | F | `65` |
| **6** | F# / Gb | `66` |
| **7** | G | `67` |
| **8** | G# / Ab | `68` |
| **9** | A | `69` |
| **10** | A# / Bb | `70` |
| **11** | B | `71` |

---

## 3. Microtonal Tuning via Pitch Bends

Pitch Bend in MIDI is a 14-bit unsigned value ($0$ to $16383$), split into two 7-bit bytes:
* **LSB (Least Significant Byte):** `Data Byte 1`
* **MSB (Most Significant Byte):** `Data Byte 2`

### Standard Reference Pitch Bend Values (Range: $\pm 200$ Cents)

| Pitch Offset | Decimal Value | LSB (Hex) | MSB (Hex) |
| :--- | :--- | :--- | :--- |
| **$-200$ Cents (Full Down)** | `0` | `0x00` | `0x00` |
| **$0$ Cents (Center / No Bend)** | `8192` | `0x00` | `0x40` |
| **$+200$ Cents (Full Up)** | `16383` | `0x7F` | `0x7F` |

### Pitch Bend Calculation Formula

To calculate the 14-bit pitch bend integer value ($V$) for a target deviation in cents ($\Delta C$) where the pitch bend range is set to $\pm 200$ cents:

$$V = \text{Clamp}\left(\text{Round}\left(8192 + \left(\frac{\Delta C}{200} \times 8191\right)\right), 0, 16383\right)$$

* **LSB:** $V \ \& \ \text{0x7F}$
* **MSB:** $(V \gg 7) \ \& \ \text{0x7F}$

### Common Scale Deviations in Just Intonation (5-Limit)

* **Syntonic Comma Adjustment:** $\approx \pm 21.51$ cents ($\approx \pm 881$ steps from center `8192`).
  * **$-1$ Comma Level ($\approx -22$ cents):** Pitch Bend Value $\approx 7311$ (`LSB: 0x1F`, `MSB: 0x39`)
  * **$0$ Comma Level ($0$ cents):** Pitch Bend Value $= 8192$ (`LSB: 0x00`, `MSB: 0x40`)
  * **$+1$ Comma Level ($\approx +22$ cents):** Pitch Bend Value $\approx 9073$ (`LSB: 0x61`, `MSB: 0x46`)

---

## 4. MIDI Message Sequence Format

When triggering a note programmatically or generating a MIDI file, observe the exact event ordering per channel.

### Step-by-Step Play Sequence

1. **Select an Available MIDI Channel ($n = 0 \text{ to } 15$):** Find a channel not currently playing an active note.
2. **Send Pitch Bend Message (`0xEn`):**
   * `Status Byte`: `0xE0 + n`
   * `Data Byte 1`: `LSB`
   * `Data Byte 2`: `MSB`
3. **Send Note On Message (`0x9n`):**
   * `Status Byte`: `0x90 + n`
   * `Data Byte 1`: `Base MIDI Note Number` ($0$–$127$)
   * `Data Byte 2`: `Velocity` ($1$–$127$, standard: $64$)
4. **Send Note Off Message (`0x8n`):** (When releasing the note)
   * `Status Byte`: `0x80 + n`
   * `Data Byte 1`: `Base MIDI Note Number`
   * `Data Byte 2`: `Release Velocity` (standard: $0$)
5. **Release Channel:** Mark channel $n$ as available for reallocation.

---

## 5. Practical Scale Examples

### Example 1: Just C-Major Scale ($C^0 - D^0 - E^{-1} - F^0 - G^0 - A^{-1} - B^{-1} - C^0$)

| Note | Harmonium Key | Base MIDI Note | Cent Offset ($\Delta C$) | Pitch Bend Value (Dec) | MIDI Sequence (Status, Data1, Data2) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **C** | $C^0$ | `60` | $0$ | `8192` | `0xE0 0x00 0x40`, `0x90 0x3C 0x40` |
| **D** | $D^0$ | `62` | $0$ | `8192` | `0xE1 0x00 0x40`, `0x91 0x3E 0x40` |
| **E** | $E^{-1}$ | `64` | $-21.51$ | `7311` | `0xE2 0x1F 0x39`, `0x92 0x40 0x40` |
| **F** | $F^0$ | `65` | $0$ | `8192` | `0xE3 0x00 0x40`, `0x93 0x41 0x40` |
| **G** | $G^0$ | `67` | $0$ | `8192` | `0xE4 0x00 0x40`, `0x94 0x43 0x40` |
| **A** | $A^{-1}$ | `69` | $-21.51$ | `7311` | `0xE5 0x1F 0x39`, `0x95 0x45 0x40` |
| **B** | $B^{-1}$ | `71` | $-21.51$ | `7311` | `0xE6 0x1F 0x39`, `0x96 0x47 0x40` |
| **C** | $C^0$ | `72` | $0$ | `8192` | `0xE7 0x00 0x40`, `0x97 0x48 0x40` |

### Example 2: Just C-Minor Scale ($C^0 - D^0 - Eb^{+1} - F^0 - G^0 - Ab^{+1} - Bb^{+1} - C^0$)

| Note | Harmonium Key | Base MIDI Note | Cent Offset ($\Delta C$) | Pitch Bend Value (Dec) | MIDI Sequence (Status, Data1, Data2) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **C** | $C^0$ | `60` | $0$ | `8192` | `0xE0 0x00 0x40`, `0x90 0x3C 0x40` |
| **D** | $D^0$ | `62` | $0$ | `8192` | `0xE1 0x00 0x40`, `0x91 0x3E 0x40` |
| **Eb**| $Es^{+1}$ | `63` | $+21.51$ | `9073` | `0xE2 0x61 0x46`, `0x92 0x3F 0x40` |
| **F** | $F^0$ | `65` | $0$ | `8192` | `0xE3 0x00 0x40`, `0x93 0x41 0x40` |
| **G** | $G^0$ | `67` | $0$ | `8192` | `0xE4 0x00 0x40`, `0x94 0x43 0x40` |
| **Ab**| $As^{+1}$ | `68` | $+21.51$ | `9073` | `0xE5 0x61 0x46`, `0x95 0x44 0x40` |
| **Bb**| $B^{+1}$ | `70` | $+21.51$ | `9073` | `0xE6 0x61 0x46`, `0x96 0x46 0x40` |
| **C** | $C^0$ | `72` | $0$ | `8192` | `0xE7 0x00 0x40`, `0x97 0x48 0x40` |

---

## 6. Implementation Guidelines for Agents

1. **Polyphony Limits:** Standard MIDI supports up to 16 channels simultaneously. If polyphony exceeds 16 simultaneous voices, round-robin channel allocation must reuse inactive channels.
2. **Pitch Bend Range Assumption:** Ensure the target software or hardware synthesizer has its Pitch Bend Range parameter explicitly set to **$\pm 2$ Semitones ($\pm 200$ Cents)** for the calculations to translate to accurate microtonal frequencies.
3. **Register / Stop Emulation:** In the original hardware, stops activate specific reed sets. In a software driver, pulling multiple stops for a single key translates to triggering two note events on separate channels (each with its distinct pitch bend micro-tuning) for a single physical keypress.