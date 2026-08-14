import { useEffect, useState } from 'react'

export function useSimulationPlayback() {
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (!isPlaying) return undefined

    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(current + 0.8, 100))
    }, 240)

    return () => window.clearInterval(timer)
  }, [isPlaying])

  useEffect(() => {
    if (progress >= 100) setIsPlaying(false)
  }, [progress])

  function togglePlayback() {
    if (progress >= 100) {
      setProgress(0)
      setIsPlaying(true)
      return
    }
    setIsPlaying((current) => !current)
  }

  function reset() {
    setIsPlaying(false)
    setProgress(0)
  }

  function seek(nextProgress: number) {
    setProgress(Math.min(Math.max(nextProgress, 0), 100))
  }

  return { progress, isPlaying, togglePlayback, reset, seek }
}
