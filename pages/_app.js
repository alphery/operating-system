import 'tailwindcss/tailwind.css'
import '../styles/index.css'
import '../styles/performance.css'
import { AuthProvider } from '../context/AuthContext'

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  )
}

export default MyApp
