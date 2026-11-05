export function downloadFile(text: string, type: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], {type}));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportChart(source: string, season: string, personal = false) {
  const svg = document.getElementById('stats-scatter-svg');
  if (!svg) throw new Error('Open the scatter plot before exporting.');
  const clone = svg.cloneNode(true) as SVGElement;
  // Freeze movement at the final coordinates for a portable, static export.
  clone.querySelectorAll('[style]').forEach(el=>(el as SVGElement).style.transition='none');
  const styles = getComputedStyle(svg);
  const [, , width, height] = svg.getAttribute('viewBox')!.split(' ').map(Number);
  const caption = `ZaidTacticsBoard · ${source === 'Demo' ? 'DEMO: fictional benchmark' : source} · ${season}${personal?' · includes personal figures':''}`;
  const lines: string[] = []; let line = '';
  const limit = Math.max(25, Math.floor((width - 32) / 5.5));
  for (const word of caption.split(' ')) {
    if (line && line.length + word.length + 1 > limit) { lines.push(line); line = ''; }
    line += (line ? ' ' : '') + word;
  }
  if (line) lines.push(line);
  const exportHeight = height + lines.length * 15 + 15;
  clone.setAttribute('viewBox', `0 0 ${width} ${exportHeight}`);
  clone.setAttribute('width', String(width)); clone.setAttribute('height', String(exportHeight));
  clone.removeAttribute('id');
  clone.setAttribute('font-family', 'Inter, Arial, sans-serif');
  const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  background.setAttribute('width', '100%'); background.setAttribute('height', '100%');
  background.setAttribute('fill', styles.getPropertyValue('--stats-panel').trim());
  clone.prepend(background);
  const footer = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  footer.setAttribute('x', '16'); footer.setAttribute('y', String(height + 20));
  footer.setAttribute('font-size', '10'); footer.setAttribute('fill', styles.getPropertyValue('--stats-muted').trim());
  lines.forEach((text, index) => {
    const span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    span.setAttribute('x', '16'); span.setAttribute('dy', index ? '15' : '0'); span.textContent = text; footer.append(span);
  });
  clone.append(footer);
  let xml = new XMLSerializer().serializeToString(clone);
  for (const variable of ['--stats-panel', '--stats-quadrant', '--stats-grid', '--stats-muted', '--stats-accent', '--stats-ink']) {
    xml = xml.replaceAll(`var(${variable})`, styles.getPropertyValue(variable).trim());
  }
  downloadFile(xml, 'image/svg+xml', `zaid-stats-${source.toLowerCase()}.svg`);
}
