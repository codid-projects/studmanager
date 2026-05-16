import { LoginPageContent } from '@/components/auth/LoginPageContent';

interface LoginPageProps {
  searchParams: Promise<{
    session?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return <LoginPageContent sessionExpired={params.session === 'expired'} />;
}
