import type {HarmoniumTone} from "../model/HarmoniumTone.ts";

export function parseCSV(csvText: string, baseFrequency: number): HarmoniumTone[] {
    return csvText
        .trim()
        .split("\n")
        .map(line => {
            const [name, centStr, millioctaveStr] = line.split(";");
            const cent = parseFloat(centStr.replace(",", "."));
            return {
                name: name.trim(),
                cent,
                millioctave: parseFloat(millioctaveStr),
                frequency: baseFrequency + cent / 5
            };
        });
}


