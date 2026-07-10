import { Layout } from '../components/Layout';
import { WaterModule } from '../modules/WaterModule';

interface WaterPageProps {
  onLogout: () => void;
}

export function WaterPage({ onLogout }: WaterPageProps) {
  return (
    <Layout onLogout={onLogout}>
      <WaterModule onLogout={onLogout} />
    </Layout>
  );
}
