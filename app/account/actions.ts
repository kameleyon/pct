'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServer } from '@/lib/supabase-server';
import { getProductsByIds, getAllCategories, type Product } from '@/lib/catalog';

export type ActionResult = { ok?: boolean; error?: string };

export type ProfileUpdate = {
  fullName: string;
  phone: string;
  company: string;
  jobTitle: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateRegion: string;
  postalCode: string;
  country: string;
  marketingOptIn: boolean;
};

/** Update the signed-in user's own profile. Role and price_tier are admin-only
 *  (enforced by the profiles_role_check trigger + RLS), so they're never
 *  touched here regardless of what a caller passes in. */
export async function updateProfileAction(fields: ProfileUpdate): Promise<ActionResult> {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: 'You must be signed in.' };

  const { error } = await sb
    .from('profiles')
    .update({
      full_name: fields.fullName || null,
      phone: fields.phone || null,
      company: fields.company || null,
      job_title: fields.jobTitle || null,
      address_line1: fields.addressLine1 || null,
      address_line2: fields.addressLine2 || null,
      city: fields.city || null,
      state_region: fields.stateRegion || null,
      postal_code: fields.postalCode || null,
      country: fields.country || null,
      marketing_opt_in: fields.marketingOptIn,
    })
    .eq('id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/account');
  revalidatePath('/account/profile');
  return { ok: true };
}

/** Favorites are kept client-side (localStorage) so they work for guests too;
 *  this just resolves the saved ids to full product records + each one's
 *  category slug (for ProductCard's thumbnail lookup) for the account page. */
export async function getFavoriteProductsAction(ids: string[]): Promise<{ products: Product[]; slugById: Record<string, string> }> {
  const [products, categories] = await Promise.all([getProductsByIds(ids), getAllCategories()]);
  const slugById = Object.fromEntries(categories.map((c) => [c.id, c.slug]));
  return { products, slugById };
}
