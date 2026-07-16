import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

export type NotificationChannel = 'whatsapp' | 'sms' | 'push' | 'in_app';

export interface NotifyInput {
  recipientId: string;
  title: string;
  body: string;
  linkUrl?: string;
}

type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
type NotificationLogInsert = Database['public']['Tables']['notification_logs']['Insert'];

export async function createInAppNotification(input: NotifyInput) {
  const supabase = createClient();
  const payload: NotificationInsert = {
    recipient_id: input.recipientId,
    title: input.title,
    body: input.body,
    link_url: input.linkUrl ?? null,
  };
  const { error } = await supabase.from('notifications').insert(payload as unknown as never);
  if (error) throw new Error(`Failed to create notification: ${error.message}`);
}

export async function queueChannelNotification(
  channel: Exclude<NotificationChannel, 'in_app'>,
  input: NotifyInput
) {
  const supabase = createClient();
  const payload: NotificationLogInsert = {
    recipient_id: input.recipientId,
    channel,
    status: 'queued',
    payload: { title: input.title, body: input.body, link_url: input.linkUrl ?? null },
  };
  const { error } = await supabase.from('notification_logs').insert(payload as unknown as never);
  if (error) throw new Error(`Failed to queue ${channel} notification: ${error.message}`);
}

export async function notifyOrderEvent(input: NotifyInput) {
  await createInAppNotification(input);
  await queueChannelNotification('whatsapp', input);
}
