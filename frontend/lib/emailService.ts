import { authService } from './auth'

export interface EmailReportResponse {
  message: string
  email: string
  test_type?: string
  total_tests?: number
  sent_at: string
}

class EmailService {
  private static instance: EmailService
  private readonly baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = authService.getToken()
    
    if (!token) {
      throw new Error('Authentication required')
    }

    // Check if token is valid and refresh if needed
    if (!authService.isTokenValid(token)) {
      try {
        await authService.refreshToken()
      } catch {
        authService.logout()
        throw new Error('Session expired. Please log in again.')
      }
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authService.getToken()}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        authService.logout()
        throw new Error('Session expired. Please log in again.')
      }
      
      try {
        const error = await response.json()
        throw new Error(error.error || `Request failed with status ${response.status}`)
      } catch {
        throw new Error(`Request failed with status ${response.status}`)
      }
    }

    return response.json()
  }

  /**
   * Send a specific test result via email
   */
  async sendTestReport(testResultId: number): Promise<EmailReportResponse> {
    return this.makeRequest('/send-report', {
      method: 'POST',
      body: JSON.stringify({
        test_result_id: testResultId
      }),
    })
  }

  /**
   * Send comprehensive report with all test results
   */
  async sendComprehensiveReport(): Promise<EmailReportResponse> {
    return this.makeRequest('/send-all-reports', {
      method: 'POST',
    })
  }
}

export const emailService = EmailService.getInstance()