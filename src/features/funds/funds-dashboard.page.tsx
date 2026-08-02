import { useSearchParams } from 'react-router-dom';
import { Wallet, Building2, FolderKanban, Users } from 'lucide-react';
import { Tabs, TabsContent } from '@/shared/components/ui/tabs';
import { PageHeader } from '../components/page-header';

import { CompanyFundsPage } from '@/features/company-funds/company-funds.page';
import { ProjectFundsPage } from '@/features/projects/project-funds/project-funds.page';
import { FundsPage } from '@/features/funds/funds.page';

const FUNDS_TABS = [
  { value: 'company', label: 'صناديق الشركة', icon: <Building2 className="h-4 w-4" /> },
  { value: 'project', label: 'صناديق المشاريع', icon: <FolderKanban className="h-4 w-4" /> },
  { value: 'users', label: 'صناديق المستخدمين', icon: <Users className="h-4 w-4" /> },
];

export function FundsDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'company';

  return (
    <div className="space-y-6 h-full">
      <PageHeader
        badge="الإدارة المالية"
        title="إدارة الصناديق"
        icon={Wallet}
        tabs={FUNDS_TABS}
      />

      <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })}>
        <TabsContent value="company" className="mt-0 p-4 bg-white rounded-2xl h-full shadow outline-none border-none">
          {/* add title & icon to this div */}
          <div className="flex items-center space-x-2 mb-6">
            <Building2 className="h-6 w-6" />
            <h2 className="text-xl font-bold">صناديق الشركة</h2>
          </div>
          <CompanyFundsPage isTab />
        </TabsContent>

        <TabsContent value="project" className="mt-0 p-4 bg-white rounded-2xl shadow outline-none border-none">
          {/* add title & icon to this div */}
          <div className="flex items-center space-x-2 mb-6">
            <FolderKanban className="h-6 w-6" />
            <h2 className="text-xl font-bold">صناديق المشاريع</h2>
          </div>
          <ProjectFundsPage isTab />
        </TabsContent>

        <TabsContent value="users" className="mt-0 p-4 bg-white rounded-2xl shadow outline-none border-none">
          {/* add title & icon to this div */}
          <div className="flex items-center space-x-2 mb-6">
            <Users className="h-6 w-6" />
            <h2 className="text-xl font-bold">صناديق المستخدمين</h2>
          </div>
          <FundsPage isTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
