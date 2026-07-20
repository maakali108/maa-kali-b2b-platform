'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { homeForRole, type UserRole } from '@/lib/auth/roles';
import type { Database } from '@/types/database.types';

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

interface ProfileRoleRow {
  role: UserRole;
}

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export async function loginAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      if (issue.path[0]) fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: 'Invalid email or password. Please try again.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single<ProfileRoleRow>();

  const role = profile?.role ?? 'retailer';
  redirect(homeForRole(role));
}

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

const registerRetailerSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name.'),
  shopName: z.string().min(2, 'Enter your shop / firm name.'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number.'),
  email: z.string().email('Enter a valid email address.'),
  areaId: z.string().uuid('Select your area.'),
  address: z.string().min(5, 'Enter your shop address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export async function registerRetailerAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = registerRetailerSchema.safeParse({
    fullName: formData.get('fullName'),
    shopName: formData.get('shopName'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    areaId: formData.get('areaId'),
    address: formData.get('address'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      if (issue.path[0]) fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const { fullName, shopName, phone, email, areaId, address, password } = parsed.data;
  const supabase = createClient();

  // 1. Create the auth user. A DB trigger (handle_new_user, see
  //    supabase/migrations/0002_auth_trigger.sql) creates the matching
  //    `profiles` row from this metadata automatically.
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'retailer',
        full_name: fullName,
        phone,
      },
    },
  });

  if (signUpError) {
    if (signUpError.message.toLowerCase().includes('already registered')) {
      return { error: 'An account with this email already exists. Please log in instead.' };
    }
    return { error: signUpError.message };
  }

  if (!signUpData.session) {
    // Email confirmation is enabled on this Supabase project.
    return {
      error:
        'Account created. Please check your email to confirm your address, then log in to finish setting up your shop profile.',
    };
  }

  // 2. Create the retailer-specific row. Self-insert is permitted by
  //    RLS policy `retailers_self_insert` (id = auth.uid()) — status
  //    defaults to 'pending_approval', an admin must approve it.
  //
  //    The payload is explicitly typed against the real Insert shape
  //    first (so a typo here is still caught), then passed through an
  //    `unknown` intermediate cast at the call site only. This works
  //    around a known @supabase/postgrest-js overload-resolution quirk
  //    where `.insert()` can resolve to `never[]` independent of
  //    whether `Database` itself is correctly typed — without using
  //    the `any` type anywhere.
  type RetailerInsert = Database['public']['Tables']['retailers']['Insert'];
  const retailerPayload: RetailerInsert = {
    id: signUpData.user!.id,
    shop_name: shopName,
    area_id: areaId,
    address,
    status: 'pending_approval',
  };

  const { error: retailerError } = await supabase
    .from('retailers')
    .insert(retailerPayload as unknown as never);

  if (retailerError) {
    return { error: `Account created, but shop profile could not be saved: ${retailerError.message}` };
  }

  redirect('/pending-approval');
}
