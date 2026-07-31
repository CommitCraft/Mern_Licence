import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SetupProvider } from '../context/SetupContext';
import { useSetup } from '../hooks/useSetup';
import { SetupLayout } from '../components/SetupLayout';
import { InstallerTokenStep } from '../components/InstallerTokenStep';
import { SystemRequirementsStep } from '../components/SystemRequirementsStep';
import { DatabaseStep } from '../components/DatabaseStep';
import { ApplicationStep } from '../components/ApplicationStep';
import { CompanyStep } from '../components/CompanyStep';
import { LicenceStep } from '../components/LicenceStep';
import { AdministratorStep } from '../components/AdministratorStep';
import { ReviewStep } from '../components/ReviewStep';
import { InstallationResult } from '../components/InstallationResult';
import { useRuntimeConfig } from '../../../config/RuntimeConfigContext';

const SetupContent: React.FC = () => {
  const { currentStep } = useSetup();
  const { setupRequired, checkingSetup } = useRuntimeConfig();
  const navigate = useNavigate();

  useEffect(() => {
    if (!checkingSetup && !setupRequired) {
      navigate('/login', { replace: true });
    }
  }, [setupRequired, checkingSetup, navigate]);

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
      case 'token':
        return <InstallerTokenStep />;
      case 'requirements':
        return <SystemRequirementsStep />;
      case 'database':
        return <DatabaseStep />;
      case 'application':
        return <ApplicationStep />;
      case 'company':
        return <CompanyStep />;
      case 'licence':
        return <LicenceStep />;
      case 'administrator':
        return <AdministratorStep />;
      case 'review':
      case 'installing':
        return <ReviewStep />;
      case 'completed':
        return <InstallationResult />;
      default:
        return <InstallerTokenStep />;
    }
  };

  return <SetupLayout>{renderStep()}</SetupLayout>;
};

export const SetupPage: React.FC = () => {
  return (
    <SetupProvider>
      <SetupContent />
    </SetupProvider>
  );
};

export default SetupPage;
