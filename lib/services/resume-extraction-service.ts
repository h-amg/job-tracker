import mammoth from 'mammoth'
import { z } from 'zod'

export const ResumeExtractionSchema = z.object({
  url: z.string().url('Invalid resume URL'),
  filename: z.string().min(1, 'Filename is required'),
})

export type ResumeExtractionInput = z.infer<typeof ResumeExtractionSchema>

export class ResumeExtractionService {
  /**
   * Downloads a resume file from a URL
   */
  static async downloadResumeFromUrl(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to download resume: ${response.status} ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.error('Error downloading resume from URL:', error)
      throw new Error(`Failed to download resume: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Extracts text from a DOCX file using mammoth
   */
  static async extractTextFromDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer })
      
      if (!result.value) {
        throw new Error('No text content found in DOCX file')
      }

      // Clean up the extracted text
      const cleanedText = result.value
        .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
        .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
        .trim()

      return cleanedText
    } catch (error) {
      console.error('Error extracting text from DOCX:', error)
      throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Handles legacy .doc format (not supported by mammoth)
   */
  static async extractTextFromDoc(): Promise<string> {
    throw new Error('Legacy .doc format is not supported. Please convert to .docx format.')
  }

  /**
   * Determines file type from filename and extracts text accordingly
   */
  static async extractTextFromFile(buffer: Buffer, filename: string): Promise<string> {
    const extension = filename.toLowerCase().split('.').pop()
    
    switch (extension) {
      case 'docx':
        return await this.extractTextFromDocx(buffer)
      case 'doc':
        return await this.extractTextFromDoc()
      case 'txt':
        return buffer.toString('utf-8').trim()
      case 'pdf':
        throw new Error('PDF extraction is not supported. Please convert to .docx format.')
      default:
        throw new Error(`Unsupported file format: ${extension}. Supported formats: .docx, .txt`)
    }
  }

  /**
   * Validates that the file is a supported resume format
   */
  static validateResumeFile(filename: string): { valid: boolean; error?: string } {
    const extension = filename.toLowerCase().split('.').pop()
    const supportedFormats = ['docx', 'txt']
    
    if (!extension || !supportedFormats.includes(extension)) {
      return {
        valid: false,
        error: `Unsupported file format: ${extension}. Supported formats: ${supportedFormats.join(', ')}`
      }
    }

    return { valid: true }
  }

  /**
   * Gets file extension from filename
   */
  static getFileExtension(filename: string): string {
    return filename.toLowerCase().split('.').pop() || ''
  }

  /**
   * Estimates extraction time based on file size
   */
  static estimateExtractionTime(fileSizeBytes: number): number {
    // Rough estimate: 1-3 seconds for typical resume files
    const baseTime = 2000 // 2 seconds
    const sizeFactor = Math.min(fileSizeBytes / (100 * 1024), 2) // Max 2x for very large files
    return baseTime * (1 + sizeFactor)
  }

  /**
   * Validates input for resume extraction
   */
  static validateInput(input: ResumeExtractionInput): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      ResumeExtractionSchema.parse(input)
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`))
      }
    }

    // Additional validation
    const fileValidation = this.validateResumeFile(input.filename)
    if (!fileValidation.valid) {
      errors.push(fileValidation.error!)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}
