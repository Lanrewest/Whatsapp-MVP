/**
 * Optimizes a Cloudinary image URL for web delivery.
 * @param {string} url The original Cloudinary URL.
 * @param {object} options The transformation options.
 * @param {number} [options.width] The target width of the image.
 * @returns {string} The transformed image URL.
 */
export function optimizeCloudinaryUrl(url, { width = 400 } = {}) {
  if (!url || !url.includes("res.cloudinary.com")) return url;
  return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
}