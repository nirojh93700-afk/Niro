// =============================================================================
// EXPORT DE FICHIERS CÔTÉ NAVIGATEUR (clients, listes…) : CSV, Excel (.xlsx),
// PDF, JSON. Aucune dépendance serveur : le fichier est fabriqué sur place et
// proposé au téléchargement (sur iPhone : feuille de partage → « Enregistrer »).
// columns = [{ key, label }] ; rows = objets.
// =============================================================================

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.rel = "noopener";
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1500);
}

const cell = (v) => (v === null || v === undefined ? "" : String(v));

// ---------- CSV (séparateur ; = s'ouvre bien dans Excel français) ----------
export function toCSV(rows, columns) {
  const esc = (s) => `"${cell(s).replace(/"/g, '""')}"`;
  const head = columns.map((c) => esc(c.label)).join(";");
  const body = rows.map((r) => columns.map((c) => esc(r[c.key])).join(";")).join("\r\n");
  return new Blob(["﻿" + head + "\r\n" + body], { type: "text/csv;charset=utf-8" });
}

// ---------- JSON ----------
export function toJSON(rows, columns) {
  const out = rows.map((r) => Object.fromEntries(columns.map((c) => [c.label, r[c.key] ?? ""])));
  return new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
}

// ---------- Excel .xlsx (vrai classeur, sans bibliothèque) ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
// Archive ZIP « stockée » (sans compression) : suffisant pour un classeur Excel.
function zipStore(files) {
  const enc = new TextEncoder();
  const parts = []; const central = []; let offset = 0;
  const now = new Date();
  const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff;
  const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;
  const u16 = (n) => [n & 0xff, (n >> 8) & 0xff];
  const u32 = (n) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff];
  for (const [name, content] of files) {
    const nameB = enc.encode(name); const data = enc.encode(content); const crc = crc32(data);
    const local = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(dosTime), ...u16(dosDate), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nameB.length), ...u16(0), ...nameB]);
    parts.push(local, data);
    central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(dosTime), ...u16(dosDate), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nameB.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...nameB]));
    offset += local.length + data.length;
  }
  const cdSize = central.reduce((s, c) => s + c.length, 0);
  const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(offset), ...u16(0)]);
  return new Blob([...parts, ...central, end], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
const xml = (s) => cell(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function colName(i) { let s = ""; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
export function toXLSX(rows, columns, sheetName = "Clients") {
  const line = (vals, r, bold) => `<row r="${r}">` + vals.map((v, i) => {
    const ref = `${colName(i)}${r}`;
    const n = typeof v === "number" && Number.isFinite(v);
    if (n) return `<c r="${ref}"${bold ? ' s="1"' : ""}><v>${v}</v></c>`;
    return `<c r="${ref}" t="inlineStr"${bold ? ' s="1"' : ""}><is><t xml:space="preserve">${xml(v)}</t></is></c>`;
  }).join("") + "</row>";
  const rowsXml = [line(columns.map((c) => c.label), 1, true), ...rows.map((r, i) => line(columns.map((c) => r[c.key] ?? ""), i + 2, false))].join("");
  const cols = `<cols>${columns.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${Math.min(60, Math.max(12, (c.width || c.label.length + 6)))}" customWidth="1"/>`).join("")}</cols>`;
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${rowsXml}</sheetData></worksheet>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" applyFont="1"/></cellXfs></styleSheet>`;
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xml(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const types = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;
  return zipStore([["[Content_Types].xml", types], ["_rels/.rels", rels], ["xl/workbook.xml", workbook], ["xl/_rels/workbook.xml.rels", wbRels], ["xl/styles.xml", styles], ["xl/worksheets/sheet1.xml", sheet]]);
}

// ---------- PDF (tableau paginé, en-tête de marque) ----------
export async function toPDF(rows, columns, { title = "Clients", subtitle = "" } = {}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: columns.length > 5 ? "landscape" : "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
  const m = 12; const usable = W - 2 * m;
  const weights = columns.map((c) => c.width || Math.max(8, c.label.length + 4));
  const totalW = weights.reduce((s, w) => s + w, 0);
  const widths = weights.map((w) => (w / totalW) * usable);
  const lineH = 6;
  let y = m;
  const header = () => {
    doc.setTextColor(169, 137, 53); doc.setFont("helvetica", "bold"); doc.setFontSize(15);
    doc.text("Niv Création", m, y + 5);
    doc.setTextColor(60, 52, 40); doc.setFontSize(11);
    doc.text(title, W - m, y + 5, { align: "right" });
    if (subtitle) { doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(122, 114, 104); doc.text(subtitle, W - m, y + 10, { align: "right" }); }
    y += 15;
    doc.setFillColor(251, 244, 230); doc.rect(m, y, usable, lineH + 1, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(60, 52, 40);
    let x = m;
    columns.forEach((c, i) => { doc.text(c.label, x + 1.5, y + 4.5); x += widths[i]; });
    y += lineH + 1;
    doc.setFont("helvetica", "normal");
  };
  header();
  rows.forEach((r, idx) => {
    if (y + lineH > H - m) { doc.addPage(); y = m; header(); }
    if (idx % 2 === 1) { doc.setFillColor(250, 248, 243); doc.rect(m, y, usable, lineH, "F"); }
    let x = m;
    columns.forEach((c, i) => {
      const txt = doc.splitTextToSize(cell(r[c.key]), widths[i] - 3)[0] || "";
      doc.setFontSize(8); doc.setTextColor(43, 38, 32);
      doc.text(txt, x + 1.5, y + 4.2);
      x += widths[i];
    });
    y += lineH;
  });
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p); doc.setFontSize(7.5); doc.setTextColor(140, 130, 115);
    doc.text(`${rows.length} ligne${rows.length > 1 ? "s" : ""} · exporté le ${new Date().toLocaleDateString("fr-FR")} · page ${p}/${pages}`, W / 2, H - 6, { align: "center" });
  }
  return doc.output("blob");
}

// Point d'entrée unique : format = csv | xlsx | pdf | json.
export async function exportRows(format, rows, columns, { basename = "export", title = "Export", subtitle = "" } = {}) {
  const stamp = new Date().toISOString().slice(0, 10);
  if (format === "csv") return downloadBlob(toCSV(rows, columns), `${basename}-${stamp}.csv`);
  if (format === "xlsx") return downloadBlob(toXLSX(rows, columns, title), `${basename}-${stamp}.xlsx`);
  if (format === "json") return downloadBlob(toJSON(rows, columns), `${basename}-${stamp}.json`);
  if (format === "pdf") return downloadBlob(await toPDF(rows, columns, { title, subtitle }), `${basename}-${stamp}.pdf`);
  throw new Error("Format inconnu");
}
