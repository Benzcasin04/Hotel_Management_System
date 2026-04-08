import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminSettings = () => {
  return (
    <div className="animate-fade-in">
      <h1 className="font-heading text-2xl font-bold text-foreground">Admin Settings</h1>
      <p className="text-sm text-muted-foreground">System configuration</p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Hotel Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Hotel Name:</strong> LuxeStay</p>
            <p><strong className="text-foreground">Address:</strong> 123 Luxury Ave, Makati City, Manila</p>
            <p><strong className="text-foreground">Phone:</strong> +63 2 8888 0000</p>
            <p><strong className="text-foreground">Email:</strong> info@luxestay.com</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Database:</strong> Not connected (mock data)</p>
            <p><strong className="text-foreground">Auth:</strong> Local state (simulated)</p>
            <p><strong className="text-foreground">Payments:</strong> Simulated</p>
            <p><strong className="text-foreground">Data API:</strong> Disabled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Audit Trail</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Admin actions are logged with admin ID. Full audit trail will be available once the backend is connected.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
