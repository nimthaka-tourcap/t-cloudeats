/**
 * Payment Slip / Bank Transfer Receipt utilities
 * Supports PDF, PNG, JPG/JPEG, WEBP, and HEIC formats.
 */

export function isPdfReceipt(dataUrl?: string, filename?: string): boolean {
  if (!dataUrl && !filename) return false;
  if (dataUrl?.startsWith("data:application/pdf") || dataUrl?.includes("application/pdf")) {
    return true;
  }
  if (filename?.toLowerCase().endsWith(".pdf")) {
    return true;
  }
  return false;
}

export function isImageReceipt(dataUrl?: string, filename?: string): boolean {
  if (!dataUrl && !filename) return false;
  if (dataUrl?.startsWith("data:image/")) {
    return true;
  }
  const f = filename?.toLowerCase() || "";
  return f.endsWith(".jpg") || f.endsWith(".jpeg") || f.endsWith(".png") || f.endsWith(".webp") || f.endsWith(".heic") || f.endsWith(".heif");
}

export function base64ToBlob(dataUrl: string, defaultMime = "application/octet-stream"): Blob {
  if (!dataUrl) return new Blob([], { type: defaultMime });
  
  const parts = dataUrl.split(";base64,");
  let mime = defaultMime;
  let base64Data = dataUrl;

  if (parts.length > 1) {
    mime = parts[0].replace(/^data:/, "");
    base64Data = parts[1];
  } else if (dataUrl.startsWith("data:")) {
    const semi = dataUrl.indexOf(";");
    if (semi > 5) {
      mime = dataUrl.slice(5, semi);
      base64Data = dataUrl.slice(dataUrl.indexOf(",") + 1);
    }
  }

  try {
    const byteCharacters = atob(base64Data.trim());
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mime });
  } catch (err) {
    console.error("Error converting base64 to Blob:", err);
    return new Blob([], { type: mime });
  }
}

export function createReceiptBlobUrl(dataUrl: string, defaultMime?: string): string {
  const mime = isPdfReceipt(dataUrl) ? "application/pdf" : defaultMime || "image/jpeg";
  const blob = base64ToBlob(dataUrl, mime);
  return URL.createObjectURL(blob);
}

/**
 * Safely opens a receipt slip in a new tab or browser viewer.
 * Fixes the issue where modern browsers block data: URLs inside document.write for PDFs.
 */
export function openReceiptSlip(dataUrl: string, filename?: string): void {
  if (typeof window === "undefined" || !dataUrl) return;

  const isPdf = isPdfReceipt(dataUrl, filename);
  const blob = base64ToBlob(dataUrl, isPdf ? "application/pdf" : "image/jpeg");
  const blobUrl = URL.createObjectURL(blob);

  // Open native blob URL in new tab
  const newTab = window.open(blobUrl, "_blank");
  if (!newTab) {
    // If pop-up blocker caught it, trigger direct download
    downloadReceiptSlip(dataUrl, filename);
  }
}

/**
 * Downloads the receipt file directly to the device.
 */
export function downloadReceiptSlip(dataUrl: string, filename?: string): void {
  if (typeof window === "undefined" || !dataUrl) return;

  const isPdf = isPdfReceipt(dataUrl, filename);
  const defaultName = isPdf ? "bank_transfer_slip.pdf" : "bank_transfer_slip.jpg";
  const safeName = filename || defaultName;

  const blob = base64ToBlob(dataUrl, isPdf ? "application/pdf" : "image/jpeg");
  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}
