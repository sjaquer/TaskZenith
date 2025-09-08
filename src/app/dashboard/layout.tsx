
'use client';

import { AppShell } from '@/components/layout/app-shell';
import { UICustomizer } from '@/components/layout/ui-customizer';
import withAuth from '@/components/auth/withAuth';
import { VoiceTaskGenerator } from '@/components/tasks/voice-task-generator';
import { useTheme } from '@/contexts/theme-context';

function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { layoutConfig } = useTheme();

  return (
    <AppShell>
      <div className="flex-1">
        {children}
      </div>
      {layoutConfig.showVoiceButton && <VoiceTaskGenerator />}
      <UICustomizer />
    </AppShell>
  );
}

export default withAuth(DashboardLayout);
