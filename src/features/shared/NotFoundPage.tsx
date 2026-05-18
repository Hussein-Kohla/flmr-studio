import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-9xl mb-4 font-black text-[var(--border-strong)] selection:bg-transparent">
        404
      </div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
        Page Not Found
      </h1>
      <p className="text-[var(--text-secondary)] mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link to="/">
        <Button>Go back home</Button>
      </Link>
    </div>
  )
}
