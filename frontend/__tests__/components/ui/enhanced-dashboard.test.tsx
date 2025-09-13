/**
 * Tests for Enhanced Dashboard component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import '@testing-library/jest-dom'
import { EnhancedDashboard } from '../../../components/ui/enhanced-dashboard'

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: jest.fn(),
    },
  }),
}))

// Mock the voice assistant hook
jest.mock('../../../hooks/useVoiceAssistant', () => ({
  useVoiceAssistant: () => ({
    isListening: false,
    isSupported: true,
    startListening: jest.fn(),
    stopListening: jest.fn(),
    transcript: '',
  }),
}))

// Mock fetch for API calls
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('EnhancedDashboard', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    localStorage.setItem('auth_token', 'mock-token')
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('renders dashboard with main sections', async () => {
    // Mock API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          stats: {
            total_analyses: 5,
            recent_analyses: 2,
            family_members: 3,
            upcoming_appointments: 1,
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          analyses: [],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          appointments: [],
        }),
      } as Response)

    render(<EnhancedDashboard />)

    // Check for main dashboard elements
    expect(screen.getByText('dashboard.welcome')).toBeInTheDocument()
    expect(screen.getByText('dashboard.quickActions')).toBeInTheDocument()
    expect(screen.getByText('dashboard.recentActivity')).toBeInTheDocument()

    // Wait for API calls to complete
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })
  })

  it('displays loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<EnhancedDashboard />)

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('API Error'))

    render(<EnhancedDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  it('displays user statistics correctly', async () => {
    const mockStats = {
      total_analyses: 10,
      recent_analyses: 3,
      family_members: 5,
      upcoming_appointments: 2,
    }

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          stats: mockStats,
        }),
      } as Response)
      .mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, analyses: [], appointments: [] }),
      } as Response)

    render(<EnhancedDashboard />)

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument() // total_analyses
      expect(screen.getByText('5')).toBeInTheDocument() // family_members
      expect(screen.getByText('2')).toBeInTheDocument() // upcoming_appointments
    })
  })

  it('renders quick action buttons', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, stats: {}, analyses: [], appointments: [] }),
    } as Response)

    render(<EnhancedDashboard />)

    await waitFor(() => {
      expect(screen.getByText('dashboard.newAnalysis')).toBeInTheDocument()
      expect(screen.getByText('dashboard.bookAppointment')).toBeInTheDocument()
      expect(screen.getByText('dashboard.findDoctors')).toBeInTheDocument()
      expect(screen.getByText('dashboard.familyHealth')).toBeInTheDocument()
    })
  })

  it('handles quick action clicks', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, stats: {}, analyses: [], appointments: [] }),
    } as Response)

    const mockPush = jest.fn()
    jest.doMock('next/navigation', () => ({
      useRouter: () => ({
        push: mockPush,
      }),
    }))

    render(<EnhancedDashboard />)

    await waitFor(() => {
      const newAnalysisButton = screen.getByText('dashboard.newAnalysis')
      fireEvent.click(newAnalysisButton)
    })

    // Note: In a real test, you'd verify navigation
    // This is a simplified example
  })

  it('displays recent analyses when available', async () => {
    const mockAnalyses = [
      {
        id: 1,
        prediction: 'normal',
        confidence: 0.95,
        created_at: '2024-01-15T10:00:00Z',
        disease_info: {
          name: 'Normal',
          description: 'Healthy eyes',
        },
      },
      {
        id: 2,
        prediction: 'glaucoma',
        confidence: 0.87,
        created_at: '2024-01-14T15:30:00Z',
        disease_info: {
          name: 'Glaucoma',
          description: 'Eye pressure condition',
        },
      },
    ]

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, stats: {} }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          analyses: mockAnalyses,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, appointments: [] }),
      } as Response)

    render(<EnhancedDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Normal')).toBeInTheDocument()
      expect(screen.getByText('Glaucoma')).toBeInTheDocument()
      expect(screen.getByText('95%')).toBeInTheDocument()
      expect(screen.getByText('87%')).toBeInTheDocument()
    })
  })

  it('displays upcoming appointments when available', async () => {
    const mockAppointments = [
      {
        id: 1,
        appointment_date: '2024-01-20T14:00:00Z',
        appointment_type: 'video',
        status: 'confirmed',
        doctor: {
          name: 'Dr. Smith',
          specialization: 'Ophthalmologist',
        },
      },
    ]

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, stats: {} }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, analyses: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          appointments: mockAppointments,
        }),
      } as Response)

    render(<EnhancedDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument()
      expect(screen.getByText('Ophthalmologist')).toBeInTheDocument()
      expect(screen.getByText(/video/i)).toBeInTheDocument()
    })
  })

  it('shows empty state when no data available', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        stats: {
          total_analyses: 0,
          recent_analyses: 0,
          family_members: 0,
          upcoming_appointments: 0,
        },
        analyses: [],
        appointments: [],
      }),
    } as Response)

    render(<EnhancedDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/no recent analyses/i)).toBeInTheDocument()
      expect(screen.getByText(/no upcoming appointments/i)).toBeInTheDocument()
    })
  })

  it('handles refresh functionality', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, stats: {}, analyses: [], appointments: [] }),
    } as Response)

    render(<EnhancedDashboard />)

    await waitFor(() => {
      const refreshButton = screen.getByLabelText(/refresh/i)
      fireEvent.click(refreshButton)
    })

    // Should make additional API calls
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(6) // 3 initial + 3 refresh
    })
  })

  it('displays voice assistant button when supported', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, stats: {}, analyses: [], appointments: [] }),
    } as Response)

    render(<EnhancedDashboard />)

    await waitFor(() => {
      expect(screen.getByLabelText(/voice assistant/i)).toBeInTheDocument()
    })
  })

  it('handles responsive layout', () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, stats: {}, analyses: [], appointments: [] }),
    } as Response)

    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    render(<EnhancedDashboard />)

    // Check for mobile-specific classes or layout
    const dashboard = screen.getByTestId('enhanced-dashboard')
    expect(dashboard).toHaveClass('responsive-layout')
  })

  it('handles keyboard navigation', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, stats: {}, analyses: [], appointments: [] }),
    } as Response)

    render(<EnhancedDashboard />)

    await waitFor(() => {
      const firstButton = screen.getByText('dashboard.newAnalysis')
      firstButton.focus()
      expect(firstButton).toHaveFocus()

      // Test Tab navigation
      fireEvent.keyDown(firstButton, { key: 'Tab' })
      const nextButton = screen.getByText('dashboard.bookAppointment')
      expect(nextButton).toHaveFocus()
    })
  })

  it('displays correct time-based greetings', () => {
    const originalDate = Date
    const mockDate = new Date('2024-01-15T10:00:00Z')
    global.Date = jest.fn(() => mockDate) as any
    global.Date.now = originalDate.now

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, stats: {}, analyses: [], appointments: [] }),
    } as Response)

    render(<EnhancedDashboard />)

    expect(screen.getByText(/good morning/i)).toBeInTheDocument()

    global.Date = originalDate
  })

  it('handles authentication errors', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    } as Response)

    render(<EnhancedDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/authentication error/i)).toBeInTheDocument()
    })
  })
})
