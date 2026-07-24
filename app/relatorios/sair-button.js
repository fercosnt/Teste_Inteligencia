'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function SairButton() {
  const router = useRouter()

  const sair = async () => {
    await fetch('/api/login', { method: 'DELETE' })
    router.replace('/login')
    router.refresh()
  }

  return (
    <button
      onClick={sair}
      className="flex items-center gap-2 text-sm text-white/90 hover:text-white transition-colors"
    >
      <LogOut className="h-4 w-4" />
      Sair
    </button>
  )
}
