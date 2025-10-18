import OpenAI from 'openai'
import { z } from 'zod'
import { COVER_LETTER_SYSTEM_MESSAGE } from './cover-letter-prompts'
import { COVER_LETTER_PROMPT_TEMPLATE } from './cover-letter-template'

export const GenerateCoverLetterSchema = z.object({
  jobDescription: z.string().min(1, 'Job description is required'),
  resumeContent: z.string().optional(),
  companyName: z.string().min(1, 'Company name is required'),
  role: z.string().min(1, 'Role is required'),
  applicantName: z.string().optional(),
  applicantEmail: z.string().email().optional(),
  applicantPhone: z.string().optional(),
})

export type GenerateCoverLetterInput = z.infer<typeof GenerateCoverLetterSchema>

export class CoverLetterService {
  private static openai: OpenAI

  static initialize() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  static async generateCoverLetter(input: GenerateCoverLetterInput): Promise<string> {
    if (!this.openai) {
      this.initialize()
    }

    const prompt = this.buildPrompt(input)

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: COVER_LETTER_SYSTEM_MESSAGE,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      })

      const coverLetter = completion.choices[0]?.message?.content

      if (!coverLetter) {
        throw new Error('Failed to generate cover letter')
      }

      return coverLetter.trim()
    } catch (error) {
      console.error('Error generating cover letter:', error)
      throw new Error('Failed to generate cover letter. Please try again.')
    }
  }

  private static buildPrompt(input: GenerateCoverLetterInput): string {
    const {
      jobDescription,
      resumeContent,
      companyName,
      role,
      applicantName,
      applicantEmail,
      applicantPhone,
    } = input

    return COVER_LETTER_PROMPT_TEMPLATE
      .replace('{{resume_content}}', resumeContent || 'Not provided')
      .replace('{{job_description}}', jobDescription)
      .replace('{{company_name}}', companyName)
      .replace('{{role}}', role)
      .replace('{{applicant_name}}', applicantName || 'Not provided')
      .replace('{{applicant_email}}', applicantEmail || 'Not provided')
      .replace('{{applicant_phone}}', applicantPhone || 'Not provided')
  }

  static async generateCoverLetterWithRetry(
    input: GenerateCoverLetterInput,
    maxRetries = 3
  ): Promise<string> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateCoverLetter(input)
      } catch (error) {
        lastError = error as Error
        console.warn(`Cover letter generation attempt ${attempt} failed:`, error)

        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error('Failed to generate cover letter after retries')
  }

  static validateInput(input: GenerateCoverLetterInput): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!input.jobDescription || input.jobDescription.trim().length < 50) {
      errors.push('Job description must be at least 50 characters long')
    }

    if (!input.companyName || input.companyName.trim().length < 2) {
      errors.push('Company name is required')
    }

    if (!input.role || input.role.trim().length < 2) {
      errors.push('Role is required')
    }

    if (input.applicantEmail && !z.string().email().safeParse(input.applicantEmail).success) {
      errors.push('Invalid email format')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  static extractKeyRequirements(jobDescription: string): string[] {
    // Simple keyword extraction - could be enhanced with NLP
    const commonKeywords = [
      'experience', 'skills', 'knowledge', 'proficiency', 'familiarity',
      'bachelor', 'master', 'degree', 'certification', 'qualification',
      'years', 'minimum', 'required', 'preferred', 'essential',
      'team', 'leadership', 'communication', 'problem-solving',
      'analytical', 'technical', 'creative', 'collaborative',
    ]

    const words = jobDescription.toLowerCase().split(/\s+/)
    const foundKeywords = commonKeywords.filter(keyword => 
      words.some(word => word.includes(keyword))
    )

    return foundKeywords.slice(0, 10) // Return top 10 keywords
  }

  static estimateGenerationTime(jobDescriptionLength: number): number {
    // Rough estimate: 2-5 seconds for typical job descriptions
    const baseTime = 3000 // 3 seconds
    const lengthFactor = Math.min(jobDescriptionLength / 1000, 2) // Max 2x for very long descriptions
    return baseTime * (1 + lengthFactor)
  }
}
