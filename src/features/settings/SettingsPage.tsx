import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function SettingsPage() {
  const { user, logout } = useAuth()

  return (
    <PageWrapper title="Account Settings" subtitle="Manage your studio account and security.">
      <div className="max-w-xl space-y-6">
        <Card glass>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--color-brand)] to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-xl">
                {user?.email?.[0].toUpperCase() || 'U'}
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">{user?.name || 'Studio Member'}</h3>
                <p className="text-[var(--text-muted)] text-sm">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
              <Input label="Email Address" value={user?.email || ''} readOnly type="email" className="bg-black/10" />
              <div className="pt-4">
                <Button onClick={logout} variant="danger" className="w-full py-6 rounded-2xl shadow-lg">
                  Sign Out from FLMR Studio
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        <p className="text-center text-[var(--text-muted)] text-xs">
          FLMR Studio v1.0.0 &copy; 2026. All rights reserved.
        </p>
      </div>
    </PageWrapper>
  )
}
