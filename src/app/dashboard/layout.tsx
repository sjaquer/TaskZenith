'use client';

import { AppShell } from '@/components/layout/app-shell';
import { UICustomizer } from '@/components/layout/ui-customizer';
import withAuth from '@/components/auth/withAuth';
import { VoiceTaskGenerator } from '@/components/tasks/voice-task-generator';

function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell>
      <div className="flex-1">
        {children}
      </div>
      <VoiceTaskGenerator />
      <UICustomizer />
    </AppShell>
  );
}

export default withAuth(DashboardLayout);
