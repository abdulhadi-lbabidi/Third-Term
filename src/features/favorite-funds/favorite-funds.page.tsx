import { useSearchParams } from 'react-router-dom';
import { Building2, FolderKanban, Star, Users } from 'lucide-react';
import { Tabs, TabsContent } from '@/shared/components/ui/tabs';
import { PageHeader } from '../components/page-header';
import { FavoriteFundsTab } from './components/favorite-funds-tab';

const FAVORITE_FUNDS_TABS = [
  { value: 'company', label: 'صناديق الشركة', icon: <Building2 className="h-4 w-4" /> },
  { value: 'project', label: 'صناديق المشاريع', icon: <FolderKanban className="h-4 w-4" /> },
  { value: 'users', label: 'صناديق المستخدمين', icon: <Users className="h-4 w-4" /> },
];

export function FavoriteFundsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'company';

  return (
    <div className="space-y-3">
      <PageHeader
        badge="الصناديق والعملات"
        title="الصناديق المميزة"
        icon={Star}
        tabs={FAVORITE_FUNDS_TABS}
        resetSearchOnTabChange
      />

      <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })}>
        {activeTab === 'company' && (
          <TabsContent value="company" className="mt-0 rounded-2xl border-none bg-white p-4 shadow outline-none">
            <FavoriteFundsTab kind="company" />
          </TabsContent>
        )}

        {activeTab === 'project' && (
          <TabsContent value="project" className="mt-0 rounded-2xl border-none bg-white p-4 shadow outline-none">
            <FavoriteFundsTab kind="project" />
          </TabsContent>
        )}

        {activeTab === 'users' && (
          <TabsContent value="users" className="mt-0 rounded-2xl border-none bg-white p-4 shadow outline-none">
            <FavoriteFundsTab kind="user" />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
