import React from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { QueryProvider, AuthProvider, TenantProvider } from '@gaqno-dev/frontcore';
import { ModuleTabs, IModuleTabConfig } from '@gaqno-dev/frontcore/components/ui';
import { useModuleView } from '@gaqno-dev/frontcore/hooks';
import { Gamepad2, History, BookOpen, ScrollText, Library } from 'lucide-react';
import { SessionsListView } from './rpg/views/SessionsListView';
import { SessionView } from './rpg/views/SessionView';
import { CampaignsListView } from './rpg/views/CampaignsListView';
import { CampaignWizardView } from './rpg/views/CampaignWizardView';
import { CampaignDetailView } from './rpg/views/CampaignDetailView';
import { MasterDashboard } from './rpg/views/MasterDashboard';
import { LocationsView } from './rpg/views/LocationsView';
import { CustomClassesView } from './rpg/views/CustomClassesView';
import { WikiView } from './rpg/views/WikiView';
import { RulesView } from './rpg/views/RulesView';

const RPG_TABS: IModuleTabConfig[] = [
  { id: 'campaigns', label: 'Campanhas', icon: BookOpen },
  { id: 'sessions', label: 'Sessões', icon: Gamepad2 },
  { id: 'wiki', label: 'Wiki', icon: Library },
  { id: 'rules', label: 'Rules', icon: ScrollText },
  { id: 'history', label: 'Histórico', icon: History },
];

function RpgPage() {
  const location = useLocation();
  const params = useParams<{ id?: string }>();
  const searchParams = new URLSearchParams(location.search);
  
  // Check if category param exists - if so, show wiki view
  const hasCategoryParam = searchParams.has('category');
  const viewFromParams = searchParams.get('view');
  
  // If category param exists but no view param, default to wiki
  // Otherwise use the view from params or default
  const effectiveView = hasCategoryParam && !viewFromParams 
    ? 'wiki' 
    : (viewFromParams || 'sessions');
  
  const { currentView, setView } = useModuleView({
    defaultView: 'sessions',
    allowedViews: RPG_TABS.map((tab) => tab.id),
  });

  // Update view if category param is present but view is not set
  React.useEffect(() => {
    if (hasCategoryParam && !viewFromParams && currentView !== 'wiki') {
      setView('wiki');
    }
  }, [hasCategoryParam, viewFromParams, currentView, setView]);

  const pathname = location.pathname;
  const isMasterDashboard = pathname.includes('/rpg/sessions/') && params?.id && pathname.endsWith('/master');
  const isSessionDetail = pathname.includes('/rpg/sessions/') && params?.id && !isMasterDashboard;
  const isCampaignWizard = pathname.includes('/rpg/campaigns/new') || (pathname.includes('/rpg/campaigns/') && pathname.includes('/edit'));
  const isLocationsView = pathname.includes('/rpg/campaigns/') && pathname.includes('/locations');
  const isCustomClassesView = pathname.includes('/rpg/campaigns/') && pathname.includes('/custom-classes');
  const isCampaignDetail = pathname.match(/^\/rpg\/campaigns\/[^/]+$/);
  // Use effectiveView to determine wiki/rules view, accounting for category param
  const isWikiView = effectiveView === 'wiki' || currentView === 'wiki' || hasCategoryParam;
  const isRulesView = effectiveView === 'rules' || currentView === 'rules';

  if (isMasterDashboard) {
    return <MasterDashboard />;
  }

  if (isSessionDetail) {
    return <SessionView />;
  }

  if (isCampaignWizard) {
    return <CampaignWizardView />;
  }

  if (isCampaignDetail) {
    return <CampaignDetailView />;
  }

  if (isLocationsView) {
    return <LocationsView />;
  }

  if (isCustomClassesView) {
    return <CustomClassesView />;
  }

  if (isWikiView) {
    return <WikiView />;
  }

  if (isRulesView) {
    return <RulesView />;
  }

  const renderView = () => {
    const viewMap: Record<string, React.ComponentType> = {
      campaigns: CampaignsListView,
      sessions: SessionsListView,
      wiki: WikiView,
      rules: RulesView,
    };

    const ViewComponent = viewMap[currentView] || CampaignsListView;
    return <ViewComponent />;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold mb-4">RPG</h1>
          <ModuleTabs tabs={RPG_TABS} defaultView="campaigns" />
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {renderView()}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <TenantProvider>
          <RpgPage />
        </TenantProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

