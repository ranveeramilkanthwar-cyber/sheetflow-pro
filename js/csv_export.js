// SheetFlow RFC-4180 CSV Engine
function exportCSV(rows) { return '\uFEFF' + rows.map(r => r.join(',')).join('\n'); }
