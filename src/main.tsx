import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import './tailwind-app.css'
import App from './App'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

const root = document.getElementById('root')!
createRoot(root).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </StrictMode>
)
