// Cloudinary delivery URLs can be transformed at request time without
// changing the stored asset or existing database values. Non-Cloudinary
// URLs (including test fixtures) are returned unchanged, except for
// Unsplash-hosted demo images, which are downsized the same way (see below).
export function getOptimizedImageUrl(url, { width = 480, height = 480, crop = 'fill' } = {}) {
  if (!url) return url;

  if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
    const transformation = `f_auto,q_auto,w_${width},h_${height},c_${crop}`;
    return url.replace('/image/upload/', `/image/upload/${transformation}/`);
  }

  // The seeded demo listings use Unsplash URLs that are stored at w=800.
  // Listing cards/thumbnails only need `width`, so request that size
  // instead. The width is only ever reduced (never upscaled), so the Item
  // Details page keeps receiving the stored full-size image.
  if (url.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(url);
      const storedWidth = parseInt(parsed.searchParams.get('w'), 10);
      if (!Number.isFinite(storedWidth) || width < storedWidth) {
        parsed.searchParams.set('w', String(width));
        return parsed.toString();
      }
    } catch {
      // Malformed URL - fall through and use it as-is.
    }
  }

  return url;
}
