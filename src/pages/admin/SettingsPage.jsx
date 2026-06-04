import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import GeneralSettings from '../../components/GeneralSettings';
import { canAccessGeneralSettings } from '../../utils/adminAccess';

const SettingsPage = () => {
  const { user } = useSelector((state) => state.auth);

  if (!canAccessGeneralSettings(user)) {
    return <Navigate to="/admin/channels" replace />;
  }

  return <GeneralSettings />;
};

export default SettingsPage;
