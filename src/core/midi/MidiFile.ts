/**
 * Minimal Standard MIDI File reader/writer: just what is needed for note, pitch bend and tempo
 * data. Everything else (controllers, program changes, text, sysex, ...) is skipped when reading.
 */

export class MidiFormatError extends Error {}

export type MidiMessage =
    | {kind: "noteOn"; channel: number; note: number; velocity: number}
    | {kind: "noteOff"; channel: number; note: number; velocity: number}
    // 14-bit value, 8192 = centre
    | {kind: "pitchBend"; channel: number; value: number}
    | {kind: "controlChange"; channel: number; controller: number; value: number}
    | {kind: "tempo"; microsecondsPerQuarter: number}
    | {kind: "trackName"; text: string}
    | {kind: "timeSignature"; numerator: number; denominatorPower: number};

export interface MidiEvent {
    tick: number;
    message: MidiMessage;
}

export interface ParsedMidi {
    // Ticks per quarter note
    division: number;
    tracks: MidiEvent[][];
}

function varLen(value: number): number[] {
    const bytes = [value & 0x7f];
    for (let rest = Math.floor(value / 128); rest > 0; rest = Math.floor(rest / 128)) {
        bytes.unshift((rest & 0x7f) | 0x80);
    }
    return bytes;
}

function encodeMessage(message: MidiMessage): number[] {
    switch (message.kind) {
        case "noteOn":
            return [0x90 | message.channel, message.note, message.velocity];
        case "noteOff":
            return [0x80 | message.channel, message.note, message.velocity];
        case "pitchBend":
            return [0xe0 | message.channel, message.value & 0x7f, (message.value >> 7) & 0x7f];
        case "controlChange":
            return [0xb0 | message.channel, message.controller, message.value];
        case "tempo": {
            const t = message.microsecondsPerQuarter;
            return [0xff, 0x51, 0x03, (t >> 16) & 0xff, (t >> 8) & 0xff, t & 0xff];
        }
        case "trackName": {
            const text = Array.from(new TextEncoder().encode(message.text));
            return [0xff, 0x03, ...varLen(text.length), ...text];
        }
        case "timeSignature":
            return [0xff, 0x58, 0x04, message.numerator, message.denominatorPower, 24, 8];
    }
}

function u16(value: number): number[] {
    return [(value >> 8) & 0xff, value & 0xff];
}

function u32(value: number): number[] {
    return [(value >>> 24) & 0xff, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

const ascii = (text: string) => Array.from(text, char => char.charCodeAt(0));

/**
 * Encodes a Standard MIDI File. Events of a track are written in the given order (sorted by tick,
 * the sort is stable); more than one track makes it a format 1 file.
 */
export function writeMidiFile(division: number, tracks: MidiEvent[][]): Uint8Array {
    const bytes: number[] = [...ascii("MThd"), ...u32(6), ...u16(tracks.length > 1 ? 1 : 0), ...u16(tracks.length), ...u16(division)];

    for (const track of tracks) {
        const sorted = [...track].sort((a, b) => a.tick - b.tick);
        const body: number[] = [];
        let previousTick = 0;

        for (const event of sorted) {
            body.push(...varLen(event.tick - previousTick), ...encodeMessage(event.message));
            previousTick = event.tick;
        }
        body.push(0, 0xff, 0x2f, 0x00);

        bytes.push(...ascii("MTrk"), ...u32(body.length), ...body);
    }

    return Uint8Array.from(bytes);
}

class Reader {
    position = 0;
    private readonly bytes: Uint8Array;

    constructor(bytes: Uint8Array) {
        this.bytes = bytes;
    }

    get remaining(): number {
        return this.bytes.length - this.position;
    }

    u8(): number {
        if (this.position >= this.bytes.length) throw new MidiFormatError("Unexpected end of MIDI file");
        return this.bytes[this.position++];
    }

    peek(): number {
        if (this.position >= this.bytes.length) throw new MidiFormatError("Unexpected end of MIDI file");
        return this.bytes[this.position];
    }

    u16(): number {
        return (this.u8() << 8) | this.u8();
    }

    u32(): number {
        return ((this.u8() << 24) | (this.u8() << 16) | (this.u8() << 8) | this.u8()) >>> 0;
    }

    skip(count: number): void {
        if (count > this.remaining) throw new MidiFormatError("Unexpected end of MIDI file");
        this.position += count;
    }

    text(length: number): string {
        const start = this.position;
        this.skip(length);
        return String.fromCharCode(...this.bytes.subarray(start, start + length));
    }

    varLen(): number {
        let value = 0;
        for (let i = 0; i < 4; i++) {
            const byte = this.u8();
            value = value * 128 + (byte & 0x7f);
            if ((byte & 0x80) === 0) return value;
        }
        throw new MidiFormatError("Invalid variable length value in MIDI file");
    }
}

function readTrack(reader: Reader, end: number): MidiEvent[] {
    const events: MidiEvent[] = [];
    let tick = 0;
    let runningStatus = 0;

    while (reader.position < end) {
        tick += reader.varLen();

        let status = reader.peek();
        if (status & 0x80) {
            status = reader.u8();
            runningStatus = status < 0xf0 ? status : 0;
        } else if (runningStatus) {
            status = runningStatus;
        } else {
            throw new MidiFormatError("Invalid MIDI event (missing status byte)");
        }

        if (status === 0xff) {
            const type = reader.u8();
            const length = reader.varLen();
            if (type === 0x51 && length === 3) {
                const microsecondsPerQuarter = (reader.u8() << 16) | (reader.u8() << 8) | reader.u8();
                events.push({tick, message: {kind: "tempo", microsecondsPerQuarter}});
            } else if (type === 0x2f) {
                reader.skip(length);
                break;
            } else {
                reader.skip(length);
            }
        } else if (status === 0xf0 || status === 0xf7) {
            reader.skip(reader.varLen());
        } else {
            const channel = status & 0x0f;
            switch (status & 0xf0) {
                case 0x80:
                    events.push({tick, message: {kind: "noteOff", channel, note: reader.u8() & 0x7f, velocity: reader.u8() & 0x7f}});
                    break;
                case 0x90: {
                    const note = reader.u8() & 0x7f;
                    const velocity = reader.u8() & 0x7f;
                    // A note on with velocity 0 is a note off
                    events.push({tick, message: {kind: velocity === 0 ? "noteOff" : "noteOn", channel, note, velocity}});
                    break;
                }
                case 0xe0: {
                    const lsb = reader.u8() & 0x7f;
                    const msb = reader.u8() & 0x7f;
                    events.push({tick, message: {kind: "pitchBend", channel, value: (msb << 7) | lsb}});
                    break;
                }
                case 0xa0:
                case 0xb0:
                    reader.skip(2);
                    break;
                case 0xc0:
                case 0xd0:
                    reader.skip(1);
                    break;
                default:
                    throw new MidiFormatError("Invalid MIDI event");
            }
        }
    }

    return events;
}

/** Decodes the note, pitch bend and tempo events of a Standard MIDI File. */
export function parseMidiFile(bytes: Uint8Array): ParsedMidi {
    const reader = new Reader(bytes);

    if (bytes.length < 14 || reader.text(4) !== "MThd") {
        throw new MidiFormatError("Not a MIDI file");
    }
    const headerLength = reader.u32();
    reader.u16(); // format: all tracks are read the same way
    const trackCount = reader.u16();
    const division = reader.u16();
    reader.skip(Math.max(headerLength - 6, 0));

    if (division & 0x8000) throw new MidiFormatError("MIDI files with SMPTE timing are not supported");
    if (division === 0) throw new MidiFormatError("Invalid MIDI time division");

    const tracks: MidiEvent[][] = [];
    for (let i = 0; i < trackCount && reader.remaining >= 8; i++) {
        const id = reader.text(4);
        const length = reader.u32();
        if (id !== "MTrk") {
            reader.skip(length);
            continue;
        }
        const end = Math.min(reader.position + length, bytes.length);
        tracks.push(readTrack(reader, end));
        reader.position = end;
    }

    return {division, tracks};
}
