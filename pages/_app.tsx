import type { AppProps } from 'next/app'
import 'tailwindcss/tailwind.css'
import '../styles/sf-pro.css'
import '../styles/index.css'
import '../styles/performance.css'
import { AuthProvider } from '../context/AuthContext-new'
import { SupabaseAuthProvider } from '../context/SupabaseAuthContext'
import { SocketProvider } from '../context/SocketContext'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SupabaseAuthProvider>
      <SocketProvider>
        <AuthProvider>
          <Component {...pageProps} />
        </AuthProvider>
      </SocketProvider>
    </SupabaseAuthProvider>
  )
}

export default MyApp
