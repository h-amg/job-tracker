import { put, del } from '@vercel/blob'
import { z } from 'zod'

export const UploadFileSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
  size: z.number().max(10 * 1024 * 1024), // 10MB max
})

export type UploadFileInput = z.infer<typeof UploadFileSchema>

export class BlobService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ]

  static async uploadFile(
    file: File | Buffer,
    filename: string,
    contentType: string,
    folder: 'resumes' | 'cover-letters' = 'resumes'
  ) {
    // Validate file
    if (file instanceof File) {
      if (file.size > this.MAX_FILE_SIZE) {
        throw new Error('File size exceeds 10MB limit')
      }
      
      if (!this.ALLOWED_TYPES.includes(file.type)) {
        throw new Error('File type not allowed. Please upload PDF, DOC, DOCX, or TXT files.')
      }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = filename.split('.').pop() || 'pdf'
    const uniqueFilename = `${folder}/${timestamp}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    try {
      const blob = await put(uniqueFilename, file, {
        access: 'public',
        contentType,
      })

      return {
        url: blob.url,
        filename: uniqueFilename,
        size: file instanceof File ? file.size : (file as Buffer).length,
        contentType,
      }
    } catch (error) {
      console.error('Error uploading file to Vercel Blob:', error)
      throw new Error('Failed to upload file')
    }
  }

  static async uploadResume(file: File | Buffer, filename: string) {
    const contentType = file instanceof File ? file.type : 'application/pdf'
    return await this.uploadFile(file, filename, contentType, 'resumes')
  }

  static async uploadCoverLetter(content: string, filename: string) {
    const buffer = Buffer.from(content, 'utf-8')
    return await this.uploadFile(buffer, filename, 'text/plain', 'cover-letters')
  }

  static async deleteFile(url: string) {
    try {
      await del(url)
      return true
    } catch (error) {
      console.error('Error deleting file from Vercel Blob:', error)
      return false
    }
  }

  static validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'File size exceeds 10MB limit' }
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { 
        valid: false, 
        error: 'File type not allowed. Please upload PDF, DOC, DOCX, or TXT files.' 
      }
    }

    return { valid: true }
  }

  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  static isImageFile(filename: string): boolean {
    const extension = this.getFileExtension(filename)
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)
  }

  static isDocumentFile(filename: string): boolean {
    const extension = this.getFileExtension(filename)
    return ['pdf', 'doc', 'docx', 'txt'].includes(extension)
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}
