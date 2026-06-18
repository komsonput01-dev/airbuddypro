import { createContext, useContext, useState } from 'react'

const CalculatorContext = createContext(null)

export function CalculatorProvider({ children }) {
  // Shared BTU value from BTU Calc → Electrical Calc
  const [sharedBTU, setSharedBTU] = useState(null)
  // Shared job logger fields from Nameplate Scanner → Job Logger
  const [scannedJobData, setScannedJobData] = useState(null)

  return (
    <CalculatorContext.Provider value={{
      sharedBTU,
      setSharedBTU,
      scannedJobData,
      setScannedJobData,
    }}>
      {children}
    </CalculatorContext.Provider>
  )
}

export function useCalculator() {
  const ctx = useContext(CalculatorContext)
  if (!ctx) throw new Error('useCalculator must be used within CalculatorProvider')
  return ctx
}
