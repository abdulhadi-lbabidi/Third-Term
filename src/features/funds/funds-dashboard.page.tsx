import { useSearchParams } from 'react-router-dom';
import { Wallet, FolderKanban, Users } from 'lucide-react';
import { Tabs, TabsContent } from '@/shared/components/ui/tabs';
import { PageHeader } from '../components/page-header';

import { ProjectFundsPage } from '@/features/projects/project-funds/project-funds.page';
import { FundsPage } from '@/features/funds/funds.page';

const FUNDS_TABS = [
  { value: 'project', label: 'صناديق المشاريع', icon: <FolderKanban className="h-4 w-4" /> },
  { value: 'users', label: 'صناديق المستخدمين', icon: <Users className="h-4 w-4" /> },
];

export function FundsDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'project';

  return (
    <div className="space-y-3">
      <PageHeader
        badge="الإدارة المالية"
        title="إدارة الصناديق"
        icon={Wallet}
        tabs={FUNDS_TABS}
        resetSearchOnTabChange
      />

      <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })}>
        {activeTab === 'project' && <TabsContent value="project" className="mt-0 p-4 bg-white rounded-2xl shadow outline-none border-none">
          <ProjectFundsPage isTab />
        </TabsContent>}

        {activeTab === 'users' && <TabsContent value="users" className="mt-0 p-4 bg-white rounded-2xl shadow outline-none border-none">
          <FundsPage isTab />
        </TabsContent>}
      </Tabs>
    </div>
  );
}
