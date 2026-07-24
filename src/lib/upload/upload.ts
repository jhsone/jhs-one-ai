import { v2 as cloudinary } from 'cloudinary'

function ensureCloudinaryConfig() {
  const name = process.env.CLOUDINARY_CLOUD_NAME
  const key = process.env.CLOUDINARY_API_KEY
  const secret = process.env.CLOUDINARY_API_SECRET
  if (!name || !key || !secret) {
    throw new Error(
      'Cloudinary is not configured. Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET.'
    )
  }
  cloudinary.config({
    cloud_name: name,
    api_key: key,
    api_secret: secret,
  })
}

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
  ensureCloudinaryConfig()

  try {
    const isImage = mimeType.startsWith('image/')
    const isPdf = mimeType === 'application/pdf'
    const isAudio = mimeType.startsWith('audio/')

    const base64 = buffer.toString('base64')
    const dataUri = `data:${mimeType};base64,${base64}`

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `jhs-one-ai/${userId}`,
      public_id: `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
      resource_type: isImage || isPdf ? 'image' : isAudio ? 'video' : 'raw',
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
  } catch (err: any) {
    throw new Error(`Cloudinary upload failed: ${err.message || 'Unknown error'}`)
  }
}

export async function deleteFromCloudinary(publicId: string) {
  ensureCloudinaryConfig()

  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (err: any) {
    throw new Error(`Cloudinary delete failed: ${err.message || 'Unknown error'}`)
  }
}
