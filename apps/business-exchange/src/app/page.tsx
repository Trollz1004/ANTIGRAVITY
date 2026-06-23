import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function HomePage() {
  const cookieStore = cookies();
  const membership record = cookieStore.get('be_session')?.value;

  if (membership record) {
    redirect('/dashboard');
  } else {
    redirect('/auth/login');
  }
}
