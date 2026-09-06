// Cloudinary delivery URLs can be transformed at request time without
// changing the stored asset or existing database values. Non-Cloudinary
// URLs (including test fixtures) are returned unchanged.
export function getOptimizedImageUrl(url, { width = 480, height = 480, crop = 'fill' } = {}) {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) {
    return url;
  }

  const transformation = `f_auto,q_auto,w_${width},h_${height},c_${crop}`;
  return url.replace('/image/upload/', `/image/upload/${transformation}/`);
}

