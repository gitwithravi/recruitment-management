const QUOTE_REGEX = /["\n\r,]/;

function escapeCsvField(value: string): string {
  if (!QUOTE_REGEX.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '""')}"`;
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows
    .map((row) => row.map((cell) => escapeCsvField(cell?.toString() ?? "")).join(","))
    .join("\r\n");
}

export function csvResponse(filename: string, csv: string): Response {
  const bom = "\uFEFF";

  return new Response(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]+/g, "_").slice(0, 60);
}