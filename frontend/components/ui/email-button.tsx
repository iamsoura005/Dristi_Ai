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
      
      // For demo purposes, we'll simulate a successful email send
      // In a real app, this would call your backend API
      if (type === 'comprehensive') {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // In demo mode, we'll just show success
        toast.success('Comprehensive report sent to your email!')
        response = {
          message: 'Report sent successfully',
          email: 'user@example.com',
          total_tests: 5,
          sent_at: new Date().toISOString()
        }
      } else {
        if (!testResultId) {
          toast.error('Test result ID is required')
          setIsLoading(false)
          return
        }
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // In demo mode, we'll just show success
        toast.success('Test report sent to your email!')
        response = {
          message: 'Report sent successfully',
          email: 'user@example.com',
          test_type: 'eye_disease',
          sent_at: new Date().toISOString()
        }
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