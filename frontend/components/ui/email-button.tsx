"use client"

import { useState } from 'react'
import { Mail, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { emailService } from '@/lib/emailService'
import { toast } from 'sonner'

interface EmailButtonProps {
  testResultId?: number
  type?: 'single' | 'comprehensive'
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  children?: React.ReactNode
}

export default function EmailButton({ 
  testResultId, 
  type = 'single', 
  variant = 'outline',
  size = 'default',
  className = '',
  children 
}: EmailButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSendEmail = async () => {
    if (isLoading || isSent) return

    setIsLoading(true)
    try {
      let response
      
      if (type === 'comprehensive') {
        response = await emailService.sendComprehensiveReport()
        toast.success('Comprehensive report sent to your email!')
      } else {
        if (!testResultId) {
          toast.error('Test result ID is required')
          return
        }
        response = await emailService.sendTestReport(testResultId)
        toast.success('Test report sent to your email!')
      }

      console.log('Email sent successfully:', response)
      setIsSent(true)
      
      // Reset the sent state after 3 seconds
      setTimeout(() => setIsSent(false), 3000)
      
    } catch (error) {
      console.error('Failed to send email:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSendEmail}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={`${className} ${isSent ? 'text-green-400 border-green-400' : ''}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Sending...
        </>
      ) : isSent ? (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Sent!
        </>
      ) : (
        <>
          <Mail className="w-4 h-4 mr-2" />
          {children || (type === 'comprehensive' ? 'Email All Reports' : 'Email Report')}
        </>
      )}
    </Button>
  )
}