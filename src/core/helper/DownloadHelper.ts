/** Offers `data` as a file download. */
export function downloadFile(data: BlobPart, filename: string, mimeType: string): void {
    const url = URL.createObjectURL(new Blob([data], {type: mimeType}));

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}
