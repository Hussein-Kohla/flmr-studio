import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login, signup } = useAuth() as any
  const { toast } = useToast()
  const navigate = useNavigate()

  const getErrorMessage = (err: any) => {
    const msg = err.message || ''
    if (msg.includes('USER_NOT_FOUND')) return 'لا يوجد حساب مسجل بهذا البريد الإلكتروني'
    if (msg.includes('INVALID_PASSWORD')) return 'كلمة المرور التي أدخلتها غير صحيحة'
    if (msg.includes('User already exists')) return 'هذا البريد الإلكتروني مسجل بالفعل'
    return 'حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (isLogin) {
        await login(email, password)
        toast('Welcome back to FLMR Studio', 'success')
      } else {
        await signup(email, password, name)
        toast('Account created successfully', 'success')
      }
      navigate('/')
    } catch (err: any) {
      const errorMsg = getErrorMessage(err)
      setError(errorMsg)
      toast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--bg-base)] selection:bg-[var(--color-brand-subtle)]">
      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="orb orb-brand w-[800px] h-[800px] opacity-[0.07] -top-[20%] -left-[10%]" />
        <div className="orb orb-accent w-[600px] h-[600px] opacity-[0.05] bottom-[-10%] right-[-5%] animation-delay-2000" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent,rgba(14,15,21,0.8))]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] px-6 relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-block p-3 rounded-2xl bg-gradient-to-br from-[var(--color-brand-subtle)] to-transparent border border-[var(--border-subtle)] mb-6 shadow-brand"
          >
            <div className="gradient-text font-black text-3xl tracking-tighter">FLMR</div>
          </motion.div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-[var(--text-secondary)] font-medium">
            {isLogin ? 'Enter your credentials to access the studio.' : 'Join FLMR Studio and start managing projects.'}
          </p>
        </div>

        <Card glass padding="lg" className="border-[var(--border-subtle)] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-brand)] to-transparent opacity-50" />
          <CardBody className="pt-2">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {error}
              </motion.div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-black/20"
                />
              )}
              <Input
                label="Email Address"
                type="email"
                placeholder="admin@flmr.studio"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/20"
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/20"
              />
              
              <div className="pt-4">
                <Button type="submit" className="w-full shadow-brand py-6 rounded-2xl" size="lg" loading={loading}>
                  {isLogin ? 'Sign in to Studio' : 'Create Account'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <p className="text-center mt-8 text-[var(--text-muted)] text-sm">
          {isLogin ? "Don't have an account?" : "Already have an account?"} {' '}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[var(--text-primary)] font-bold hover:text-[var(--color-brand)] transition-colors"
          >
            {isLogin ? 'Create Account' : 'Sign In'}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
