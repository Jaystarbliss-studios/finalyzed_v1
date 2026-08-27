export async function uploadImageToCloudinary(file: File): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
  if (!cloudName || !uploadPreset) throw new Error('Cloudinary image uploads are not configured.');
  if (!file.type.startsWith('image/')) throw new Error('Please select an image file.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Images must be 5 MB or smaller.');

  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', uploadPreset);
  body.append('folder', 'finalyzed/profiles');

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.secure_url) throw new Error(data?.error?.message || 'Image upload failed.');
  return data.secure_url as string;
}
