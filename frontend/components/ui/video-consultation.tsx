"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  MessageCircle,
  Settings,
  Users,
  Monitor,
  Camera,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Clock,
  User,
  FileText,
  Send
} from 'lucide-react'

interface Appointment {
  id: number
  patient_info: {
    id: number
    name: string
    email: string
  }
  doctor_info: {
    id: number
    name: string
    specialization: string
  }
  appointment_date: string
  video_room_id?: string
  video_call_link?: string
  meeting_password?: string
  status: string
  duration_minutes: number
}

interface VideoConsultationProps {
  appointment: Appointment
  isDoctor?: boolean
  onEndCall?: () => void
  className?: string
}

export function VideoConsultation({ 
  appointment, 
  isDoctor = false,
  onEndCall,
  className = '' 
}: VideoConsultationProps) {
  const { t } = useTranslation()
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isCallActive, setIsCallActive] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStream = useRef<MediaStream | null>(null)
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const callStartTime = useRef<Date | null>(null)

  useEffect(() => {
    initializeCall()
    fetchChatMessages()
    
    return () => {
      cleanup()
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isCallActive && callStartTime.current) {
      interval = setInterval(() => {
        const now = new Date()
        const duration = Math.floor((now.getTime() - callStartTime.current!.getTime()) / 1000)
        setCallDuration(duration)
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isCallActive])

  const initializeCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      localStream.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
      // Initialize WebRTC peer connection
      peerConnection.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      })
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.current!.addTrack(track, stream)
      })
      
      // Handle remote stream
      peerConnection.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
      }
      
      // Handle connection state changes
      peerConnection.current.onconnectionstatechange = () => {
        const state = peerConnection.current!.connectionState
        if (state === 'connected') {
          setConnectionStatus('connected')
          setIsCallActive(true)
          callStartTime.current = new Date()
        } else if (state === 'disconnected' || state === 'failed') {
          setConnectionStatus('disconnected')
          setIsCallActive(false)
        }
      }
      
      setConnectionStatus('connected')
      setIsCallActive(true)
      callStartTime.current = new Date()
      
    } catch (error) {
      console.error('Error initializing call:', error)
      setConnectionStatus('disconnected')
    }
  }

  const cleanup = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop())
    }
    
    if (peerConnection.current) {
      peerConnection.current.close()
    }
  }

  const toggleVideo = () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }

  const toggleAudio = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
      }
    }
  }

  const endCall = () => {
    cleanup()
    setIsCallActive(false)
    onEndCall?.()
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const fetchChatMessages = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/consultation/appointments/${appointment.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setChatMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/consultation/appointments/${appointment.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newMessage,
          message_type: 'text'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setChatMessages(prev => [...prev, data.message])
        setNewMessage('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const openJitsiMeeting = () => {
    if (appointment.video_call_link) {
      window.open(appointment.video_call_link, '_blank', 'width=1200,height=800')
    }
  }

  return (
    <div className={`h-screen bg-gray-900 text-white ${className}`}>
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              {isDoctor ? appointment.patient_info.name : `Dr. ${appointment.doctor_info.name}`}
            </h2>
            <p className="text-sm text-gray-400">
              {isDoctor ? 'Patient' : appointment.doctor_info.specialization}
            </p>
          </div>
          
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
            {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          {isCallActive && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              {formatDuration(callDuration)}
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChat(!showChat)}
            className="relative"
          >
            <MessageCircle className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </Button>
          
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Video Area */}
        <div className="flex-1 relative">
          {/* Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover bg-gray-800"
          />
          
          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <User className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Fallback for Jitsi */}
          {!isCallActive && appointment.video_call_link && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <Card className="max-w-md">
                <CardHeader>
                  <CardTitle className="text-center">Join Video Call</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-gray-600">
                    Click the button below to join the video consultation
                  </p>
                  
                  {appointment.meeting_password && (
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm font-medium">Meeting Password:</p>
                      <p className="text-lg font-mono">{appointment.meeting_password}</p>
                    </div>
                  )}
                  
                  <Button onClick={openJitsiMeeting} className="w-full">
                    <Video className="h-4 w-4 mr-2" />
                    Join Video Call
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-4 bg-gray-800/80 backdrop-blur-sm rounded-full px-6 py-3">
              <Button
                variant={isAudioEnabled ? "default" : "destructive"}
                size="sm"
                onClick={toggleAudio}
                className="rounded-full w-12 h-12"
              >
                {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
              
              <Button
                variant={isVideoEnabled ? "default" : "destructive"}
                size="sm"
                onClick={toggleVideo}
                className="rounded-full w-12 h-12"
              >
                {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={endCall}
                className="rounded-full w-12 h-12"
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-white text-black border-l">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Consultation Chat</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 h-[calc(100vh-200px)]">
              <div className="space-y-3">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.sender_id === (isDoctor ? appointment.doctor_info.id : appointment.patient_info.id) ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs px-3 py-2 rounded-lg ${
                      message.sender_id === (isDoctor ? appointment.doctor_info.id : appointment.patient_info.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                />
                <Button size="sm" onClick={sendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
