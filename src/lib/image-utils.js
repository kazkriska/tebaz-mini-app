/**
 * Helper to ensure we always use the correct public URL for images.
 * This is especially useful for migrating from 'localhost' to a real domain.
 */
export function getPublicImageUrl(storedUrl) {
  if (!storedUrl || storedUrl.startsWith("placeholder")) {
    return null;
  }

  // If the user has configured a specific public URL in their environment
  // We use NEXT_PUBLIC_ prefix so it's accessible on the client side
  const publicUrlBase = process.env.NEXT_PUBLIC_MINIO_URL;

  if (publicUrlBase && storedUrl.includes("/photos/")) {
    const fileName = storedUrl.split("/").pop();
    // Return the new domain version even if the DB has 'localhost'
    return `${publicUrlBase}/${fileName}`;
  }

  return storedUrl;
}
