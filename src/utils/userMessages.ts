/** Presentation-only cleanup. Internal business codes stay in records and functions. */
export function toUserMessage(message: string): string {
  return String(message || '')
    .replace(/\b(?:UC(?:[-.][A-Z0-9]+){1,5}|BR(?:[-.]UC)?(?:[-.][A-Z0-9]+){1,5}|ASIS[-.]?\d+|QT\d{1,2}|EF-\d{1,2}|AF-\d{1,2}|BG\d{2}|PH-\d{2}|HDT\d{2}|HSKT\d{2})\b/gi, '')
    .replace(/\b(?:bước|quy trình)\s*\d+(?:[.,]\d+)?/gi, '')
    .replace(/\b(?:sơ đồ)\s*[A-Z]\d+\b/gi, '')
    .replace(/\b(?:trường hợp)\s*\d+\s*[:–-]?/gi, '')
    .replace(/\b(?:Bước|bước)\s*[A-Z]\d+\b/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+(?=[,.:;])/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
