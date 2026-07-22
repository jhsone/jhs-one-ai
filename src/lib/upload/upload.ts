import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface CloudinaryResult {
  public_id: string
  secure_url: string
  format: string
  width: number | null
  height: number | null
  bytes: number
  thumbnail_url: string | null
}

export async function uploadToCloudinary(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  userId: string
): Promise<CloudinaryResult> {
  const isImage = mimeType.startsWith('image/')
  const isPdf = mimeType === 'application/pdf'

  const base64 = buffer.toString('base64')
  const dataUri = `data:${mimeType};base64,${base64}`

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `jhs-one-ai/${userId}`,
    public_id: `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
    resource_type: isImage || isPdf ? 'image' : 'raw',
    ...(isImage ? { quality: 'auto', fetch_format: 'auto' } : {}),
  })

  return {
    public_id: result.public_id,
    secure_url: result.secure_url,
    format: result.format,
    width: result.width ?? null,
    height: result.height ?? null,
    bytes: result.bytes,
    thumbnail_url: isImage
      ? result.secure_url.replace('/upload/', '/upload/w_200,q_auto/')
      : null,
  }
}

export async function deleteFromCloudinary(publicId: string) {
  await cloudinary.uploader.destroy(publicId)
}
