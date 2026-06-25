import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function HomePage() {
  const cookieStore = cookies();
  const token = cookieStore.get('be_session')?.value;
  
  if (token) {
    redirect('/dashboard');
  } else {
    redirect('/auth/login');
  }
}