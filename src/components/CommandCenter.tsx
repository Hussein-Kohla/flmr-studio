import { Card } from '@/components/ui/Card';

// Premium Command Center displaying key metrics
export const CommandCenter: React.FC = () => {
  // Example metrics for UI
  const totalRevenue = 15000;
  const recentActivities = [{_id: 1, description: 'New client added'}, {_id: 2, description: 'Payment received'}];
  const profit = 8500;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
      <Card className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white shadow-xl">
        <h3 className="text-lg font-semibold">إجمالي الإيرادات</h3>
        <p className="text-2xl mt-2">{totalRevenue} $</p>
      </Card>
      <Card className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-xl">
        <h3 className="text-lg font-semibold">الأرباح</h3>
        <p className="text-2xl mt-2">{profit} $</p>
      </Card>
      <Card className="bg-gradient-to-r from-rose-500 to-rose-700 text-white shadow-xl">
        <h3 className="text-lg font-semibold">النشاطات الأخيرة</h3>
        <ul className="mt-2 list-disc list-inside text-sm">
          {recentActivities.map((act: any) => (
            <li key={act._id}>{act.description}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
};
