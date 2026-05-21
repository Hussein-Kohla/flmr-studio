import { useAuth } from '@/hooks/useAuth'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
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
      <div className="max-w-xl space-y-6">
        {/* Profile Card */}
        <Card glass>
          <CardHeader>
            <CardTitle>{t('profile')}</CardTitle>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-accent)] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-[var(--color-brand-glow)] transition-all">
                {user?.email?.[0].toUpperCase() || 'U'}
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
            <Select
              label={t('language')}
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
            >
              <option value="en">{t('english')}</option>
              <option value="ar">{t('arabic')}</option>
            </Select>

            {/* Theme Selector */}
            <Select
              label={t('theme')}
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
            >
              <option value="default">{t('purpleTheme')}</option>
              <option value="emerald">{t('emeraldTheme')}</option>
            </Select>
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
