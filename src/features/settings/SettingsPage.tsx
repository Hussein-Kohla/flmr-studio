import { useAuth } from '@/hooks/useAuth'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useSettings } from '@/hooks/useSettings'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { theme, setTheme, language, setLanguage, t } = useSettings()

  return (
    <PageWrapper 
      title={t('accountSettings')} 
      subtitle={t('manageAccount')}
    >
      <div className="max-w-xl mx-auto space-y-8">
        {/* Profile Card */}
        <Card glass>
          <CardHeader>
            <CardTitle>{t('profile')}</CardTitle>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-brand)] to-[var(--color-accent)] rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[var(--color-brand)] via-[var(--color-accent)] to-[#ff6b6b] flex items-center justify-center text-white text-5xl font-black shadow-2xl border-4 border-[var(--bg-card)] transition-transform duration-300 group-hover:scale-105">
                  {user?.email?.[0].toUpperCase() || 'U'}
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">{user?.name || 'Studio Member'}</h3>
                <p className="text-[var(--text-muted)] text-sm">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
              <Input 
                label={t('emailAddress')} 
                value={user?.email || ''} 
                readOnly 
                type="email" 
                className="bg-black/10 text-[var(--text-muted)] border-[var(--border-subtle)]" 
              />
            </div>
          </CardBody>
        </Card>

        {/* Customization & Preferences Card */}
        <Card glass>
          <CardHeader>
            <CardTitle>{t('settings')}</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* Language Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('language')}</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setLanguage('en')}
                  className={`flex items-center justify-center py-3 px-4 rounded-2xl border-2 transition-all duration-300 ${language === 'en' ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand)] font-bold shadow-md' : 'border-[var(--border-subtle)] hover:border-[var(--color-brand)]/50 hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]'}`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('ar')}
                  className={`flex items-center justify-center py-3 px-4 rounded-2xl border-2 transition-all duration-300 ${language === 'ar' ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand)] font-bold shadow-md' : 'border-[var(--border-subtle)] hover:border-[var(--color-brand)]/50 hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]'}`}
                >
                  العربية
                </button>
              </div>
            </div>

            {/* Theme Selector */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('theme')}</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTheme('default')}
                  className={`flex flex-col items-center gap-3 py-5 px-4 rounded-2xl border-2 transition-all duration-300 ${theme === 'default' ? 'border-[#8b5cf6] bg-[#8b5cf6]/10 text-[#8b5cf6] font-bold shadow-md transform scale-[1.02]' : 'border-[var(--border-subtle)] hover:border-[#8b5cf6]/50 hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] shadow-lg ring-4 ring-[#8b5cf6]/20" />
                  <span>{t('purpleTheme')}</span>
                </button>
                <button
                  onClick={() => setTheme('emerald')}
                  className={`flex flex-col items-center gap-3 py-5 px-4 rounded-2xl border-2 transition-all duration-300 ${theme === 'emerald' ? 'border-[#10b981] bg-[#10b981]/10 text-[#10b981] font-bold shadow-md transform scale-[1.02]' : 'border-[var(--border-subtle)] hover:border-[#10b981]/50 hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10b981] to-[#047857] shadow-lg ring-4 ring-[#10b981]/20" />
                  <span>{t('emeraldTheme')}</span>
                </button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Action Card */}
        <Card glass>
          <CardBody>
            <Button onClick={logout} variant="danger" className="w-full py-5 rounded-2xl shadow-lg font-bold">
              {t('signOut')}
            </Button>
          </CardBody>
        </Card>

        <p className="text-center text-[var(--text-muted)] text-xs">
          FLMR Studio v1.0.0 &copy; 2026. All rights reserved.
        </p>
      </div>
    </PageWrapper>
  )
}
