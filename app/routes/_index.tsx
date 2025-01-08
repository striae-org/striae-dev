import Login from './auth/login';
import { baseMeta } from '~/utils/meta';

export const meta = () => {
  return baseMeta({
    title: 'Login to Striae',
    description: 'Login to your Striae account to access your projects and data',
  });
};

export default function Index() {
  return <Login />;
}