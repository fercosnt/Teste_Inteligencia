import './globals.css'

export const metadata = {
  title: 'Teste de Raciocínio Lógico',
  description: 'Teste de Raciocínio Lógico',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
