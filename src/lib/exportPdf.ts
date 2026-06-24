export function exportProjectAsPdf(title: string, description: string, materials: string[], steps: string[], tips?: string) {
  const content = `
    <html><head><meta charset="utf-8"><title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
      h1 { color: #059669; font-size: 22px; }
      h2 { color: #0284c7; font-size: 16px; margin-top: 20px; }
      p { font-size: 13px; line-height: 1.5; }
      ul { font-size: 13px; line-height: 1.6; }
      li { margin: 4px 0; }
      .footer { margin-top: 30px; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }
    </style></head><body>
      <h1>${title}</h1>
      <p>${description}</p>
      <h2>Materiales</h2>
      <ul>${materials.map(m => `<li>${m}</li>`).join('')}</ul>
      <h2>Pasos</h2>
      <ul>${steps.map(s => `<li>${s}</li>`).join('')}</ul>
      ${tips ? `<h2>Consejos</h2><p>${tips}</p>` : ''}
      <div class="footer">Generado por EcoReEngine</div>
    </body></html>`;

  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
