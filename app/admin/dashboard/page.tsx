import { Users, UserCheck, TrendingUp, PackageSearch, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

async function getCounts() {
  const supabase = createClient();

  const [{ count: totalRetailers }, { count: pendingRetailers }] = await Promise.all([
    supabase.from('retailers').select('id', { count: 'exact', head: true }),
    supabase.from('retailers').select('id', { count: 'exact', head: true }).eq('status', 'pending_approval'),
  ]);

  return {
    totalRetailers: totalRetailers ?? 0,
    pendingRetailers: pendingRetailers ?? 0,
  };
}

export default async function AdminDashboardPage() {
  const { totalRetailers, pendingRetailers } = await getCounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-950">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-500">
          Live overview of your distribution network. Numbers reflect real data only.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Retailers" value={totalRetailers} />
        <StatCard
          icon={UserCheck}
          label="Pending Approvals"
          value={pendingRetailers}
          accent={pendingRetailers > 0}
        />
        <StatCard icon={PackageSearch} label="Products in Catalog" value={0} hint="Add products to get started" />
        <StatCard icon={TrendingUp} label="Orders Today" value={0} hint="No orders placed yet" />
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary-600" />
          <h2 className="text-sm font-semibold text-ink-800">AI Dashboard</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <InsightCard
            title="Daily Sales Prediction"
            body="Predictions activate automatically once at least 14 days of order history are available."
          />
          <InsightCard
            title="Top Selling Products"
            body="Will populate from real order data as products are sold. No data yet."
          />
          <InsightCard
            title="Low Stock Prediction"
            body="Runs against live warehouse stock and sales velocity — add products and stock to enable."
          />
          <InsightCard
            title="Customer Purchase Analysis"
            body="Retailer purchase patterns (RFM scoring) build up as orders come in."
          />
        </div>
      </div>

      {totalRetailers === 0 ? (
        <Card className="border-primary-100 bg-primary-50/40">
          <CardHeader>
            <CardTitle>Get your platform ready</CardTitle>
          </CardHeader>
          <ol className="list-inside list-decimal space-y-1.5 text-sm text-ink-600">
            <li>Set up Areas for Khagaria district (Admin → Catalog).</li>
            <li>Add Brands, Categories, and Products.</li>
            <li>Configure base pricing.</li>
            <li>Approve retailer registrations as they come in.</li>
          </ol>
        </Card>
      ) : null}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-500">{label}</p>
          <p className={`mt-1 text-2xl font-semibold ${accent ? 'text-primary-600' : 'text-ink-950'}`}>
            {value}
          </p>
          {hint ? <p className="mt-1 text-xs text-ink-400">{hint}</p> : null}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
          <Icon className="h-5 w-5 text-primary-600" />
        </div>
      </div>
    </Card>
  );
}

function InsightCard({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <p className="text-sm text-ink-500">{body}</p>
    </Card>
  );
}
