import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type NotificationChannel = 'whatsapp' | 'sms' | 'push' | 'in_app';

export interface NotifyInput {
  recipientId: string;
  title: string;
  body: string;
  linkUrl?: string;
}

/**
 * Notification architecture (Phase 1 scaffolding — real DB writes,
 * no external provider calls yet):
 *
 * 1. `createInAppNotification` writes to `notifications`, which the
 *    recipient sees immediately via Supabase Realtime (Notification
 *    Center — Phase 2 UI).
 * 2. `queueChannelNotification` writes a `notification_logs` row with
 *    status 'queued'. Phase 2+ wires this to a Supabase Edge Function
 *    that actually calls the WhatsApp Cloud API / SMS gateway and
 *    updates the row to 'sent' | 'delivered' | 'failed' with the
 *    provider's message id.
 *
 * Deliberately no demo sends, no fake provider responses — this is
 * the pipeline, not a simulation of it.
 */

export async function createInAppNotification(input: NotifyInput) {
  const supabase = createClient();
  const { error } = await supabase.from('notifications').insert({
    recipient_id: input.recipientId,
    title: input.title,
    body: input.body,
    link_url: input.linkUrl ?? null,
  });
  if (error) throw new Error(`Failed to create notification: ${error.message}`);
}

export async function queueChannelNotification(
  channel: Exclude<NotificationChannel, 'in_app'>,
  input: NotifyInput
) {
  const supabase = createClient();
  const { error } = await supabase.from('notification_logs').insert({
    recipient_id: input.recipientId,
    channel,
    status: 'queued',
    payload: { title: input.title, body: input.body, link_url: input.linkUrl ?? null },
  });
  if (error) throw new Error(`Failed to queue ${channel} notification: ${error.message}`);

  // Phase 2+: trigger the delivery Edge Function here, e.g.
  //   await fetch(`${process.env.SUPABASE_FUNCTIONS_URL}/send-${channel}`, { method: 'POST', ... })
}

/**
 * Convenience wrapper: raises an in-app notification and queues the
 * same message on WhatsApp, mirroring how order-status updates should
 * reach a retailer in Phase 2.
 */
export async function notifyOrderEvent(input: NotifyInput) {
  await createInAppNotification(input);
  await queueChannelNotification('whatsapp', input);
}
