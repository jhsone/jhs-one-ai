'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface UseVoiceReturn {
  isListening: boolean
  isSpeaking: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  speak: (text: string) => Promise<void>
  stopSpeaking: () => void
  isSupported: boolean
  error: string | null
}

export function useVoice(): UseVoiceReturn {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const speechSynthRef = useRef<SpeechSynthesis | null>(null)

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) &&
    'speechSynthesis' in window

  useEffect(() => {
    if (typeof window !== 'undefined') {
      speechSynthRef.current = window.speechSynthesis
      if (speechSynthRef.current.getVoices().length === 0) {
        speechSynthRef.current.addEventListener('voiceschanged', () => {}, { once: true })
      }
    }
    return () => {
      stopListening()
      stopSpeaking()
    }
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.')
      return
    }

    setError(null)
    setTranscript('')

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Speech recognition not available.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'bn-BD'

    recognition.onresult = (event: any) => {
      let interimText = ''
      let finalText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript
        } else {
          interimText += result[0].transcript
        }
      }
      if (finalText) {
        setTranscript(prev => prev + ' ' + finalText)
      }
    }

    recognition.onerror = (event: any) => {
      setError(`Speech recognition error: ${event.error}`)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [isSupported])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!speechSynthRef.current) {
        setError('Speech synthesis not available.')
        resolve()
        return
      }

      speechSynthRef.current.cancel()
      const utterance = new SpeechSynthesisUtterance(text)

      // Try to find a Bengali voice, fallback to any
      const voices = speechSynthRef.current.getVoices()
      const bnVoice = voices.find(v => v.lang.startsWith('bn'))
      if (bnVoice) {
        utterance.voice = bnVoice
        utterance.lang = bnVoice.lang
      } else {
        utterance.lang = 'bn-BD'
      }
      utterance.rate = 1.0
      utterance.pitch = 1.0

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => {
        setIsSpeaking(false)
        resolve()
      }
      utterance.onerror = () => {
        setIsSpeaking(false)
        setError('Speech synthesis error.')
        resolve()
      }

      speechSynthRef.current.speak(utterance)
    })
  }, [])

  const stopSpeaking = useCallback(() => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel()
    }
    setIsSpeaking(false)
  }, [])

  return {
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSupported,
    error,
  }
}
