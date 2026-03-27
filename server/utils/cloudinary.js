/**
 * Cloudinary upload utility
 * Uploads a file buffer or URL to Cloudinary under the stitchbazaar/ folder.
 * @module cloudinary
 */

import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Upload a file to Cloudinary.
 * @param {string} filePathOrBase64  Local path or base64 data URI
 * @param {string} [folder='stitchbazaar']  Cloudinary folder
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export async function uploadImage(filePathOrBase64, folder = 'stitchbazaar') {
  const result = await cloudinary.uploader.upload(filePathOrBase64, {
    folder,
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  })
  return { url: result.secure_url, publicId: result.public_id }
}

/**
 * Delete an image from Cloudinary by its public ID.
 * @param {string} publicId
 */
export async function deleteImage(publicId) {
  await cloudinary.uploader.destroy(publicId)
}

export default cloudinary
