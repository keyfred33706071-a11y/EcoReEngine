export async function compressImage(file: File, maxW: number, quality: number): Promise<File> {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.src = url;
  await new Promise<void>(resolve => { img.onload = () => resolve(); });
  URL.revokeObjectURL(url);
  let { width, height } = img;
  if (width > maxW) { height = Math.round(height * maxW / width); width = maxW; }
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);
  const blob = await new Promise<Blob>(resolve => c.toBlob(b => resolve(b!), 'image/webp', quality));
  return new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' });
}
