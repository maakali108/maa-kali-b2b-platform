import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { homeForRole, type UserRole } from '@/lib/auth/roles';

interface ProfileRoleRow {
  role: UserRole;
}

export default async function RootPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = (profile as ProfileRoleRow | null)?.role ?? 'retailer';

  redirect(homeForRole(role));
}
