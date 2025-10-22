import type {HarmoniumTone} from "../model/HarmoniumTone.ts";

export function parseCSV(csvText: string): HarmoniumTone[] {
    return csvText
        .trim()
        .split("\n")
        .map(line => {
            const [name, centStr, millioctaveStr] = line.split(";");
            return {
                name: name.trim(),
                cent: parseFloat(centStr),
                millioctave: parseFloat(millioctaveStr)
            };
        });
}


