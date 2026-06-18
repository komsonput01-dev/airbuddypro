import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [unitSystem, setUnitSystem] = useState(() => localStorage.getItem('abp_unit') || 'PSI')
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('abp_font') || 'normal')
  const [powerSaving, setPowerSaving] = useState(() => localStorage.getItem('abp_power') === 'true')
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Persist settings
  useEffect(() => { localStorage.setItem('abp_unit', unitSystem) }, [unitSystem])
  useEffect(() => { localStorage.setItem('abp_font', fontSize) }, [fontSize])
  useEffect(() => { localStorage.setItem('abp_power', powerSaving) }, [powerSaving])

  // Apply body classes for font size and power saving
  useEffect(() => {
    document.body.classList.remove('text-large', 'text-xl')
    if (fontSize === 'large') document.body.classList.add('text-large')
    if (fontSize === 'xl') document.body.classList.add('text-xl')
  }, [fontSize])

  useEffect(() => {
    if (powerSaving) document.body.classList.add('power-saving')
    else document.body.classList.remove('power-saving')
  }, [powerSaving])

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <AppContext.Provider value={{
      unitSystem, setUnitSystem,
      fontSize, setFontSize,
      powerSaving, setPowerSaving,
      isOnline,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
