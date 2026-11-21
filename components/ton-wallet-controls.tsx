"use client"

import { useEffect } from "react"
import { useTonConnectUI, useTonAddress } from "@tonconnect/ui-react"
import { useTonAvailable } from "@/app/providers"

export interface TonBridgeState {
  address: string
  openModal: () => void
  disconnect: () => Promise<void>
}

function ActiveTonObserver({
  onChange,
}: {
  onChange: (state: TonBridgeState) => void
}) {
  const [tonConnectUI] = useTonConnectUI()
  const tonAddress = useTonAddress()

  useEffect(() => {
    onChange({
      address: tonAddress,
      openModal: () => {
        tonConnectUI.openModal()
      },
      disconnect: async () => {
        await tonConnectUI.disconnect()
      },
    })
  }, [tonAddress, tonConnectUI, onChange])

  return null
}

/**
 * Safely bridges @tonconnect/ui-react hooks only when TonConnectUIProvider
 * is mounted, preventing runtime crashes on domains where the manifest is unavailable.
 */
export function TonConnectBridge({
  onChange,
}: {
  onChange: (state: TonBridgeState) => void
}) {
  const tonAvailable = useTonAvailable()

  useEffect(() => {
    if (!tonAvailable) {
      onChange({
        address: "",
        openModal: () => {},
        disconnect: async () => {},
      })
    }
  }, [tonAvailable, onChange])

  if (!tonAvailable) return null
  return <ActiveTonObserver onChange={onChange} />
}
