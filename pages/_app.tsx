import type { AppProps } from 'next/app'
import 'tailwindcss/tailwind.css'
import '../styles/sf-pro.css'
import '../styles/index.css'
import '../styles/performance.css'
import { AuthProvider } from '../context/AuthContext'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  )
}

export default MyApp
