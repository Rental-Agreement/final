import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Home, CreditCard, FileText, AlertCircle } from "lucide-react";

const TenantDashboard = () => {
  return (
    <DashboardLayout role="tenant">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tenant Dashboard</h1>
          <p className="text-muted-foreground">Manage your rentals and payments</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Current Rent</CardDescription>
              <CardTitle className="text-2xl">$1,200</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Next Payment</CardDescription>
              <CardTitle className="text-2xl">Jan 1</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Lease Ends</CardDescription>
              <CardTitle className="text-2xl">Jun 30</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Security Deposit</CardDescription>
              <CardTitle className="text-2xl">$1,200</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Home className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Current Property</CardTitle>
                  <CardDescription>View your rental details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <p className="text-sm"><strong>Property:</strong> Sunshine Apartments</p>
                <p className="text-sm"><strong>Room:</strong> A-101</p>
                <p className="text-sm"><strong>Bed:</strong> Bed 1</p>
              </div>
              <Button variant="outline" className="w-full">View Details</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-success" />
                </div>
                <div>
                  <CardTitle>Make Payment</CardTitle>
                  <CardDescription>Pay your monthly rent</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <p className="text-sm">Amount Due: <strong>$1,200</strong></p>
                <p className="text-sm">Due Date: <strong>January 1, 2025</strong></p>
              </div>
              <Button className="w-full">Pay Now</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>View past transactions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">Track all your rent payments and receipts</p>
              <Button variant="outline" className="w-full">View History</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <CardTitle>Raise Dispute</CardTitle>
                  <CardDescription>Report an issue</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">Submit disputes for payment or property issues</p>
              <Button variant="outline" className="w-full">Create Dispute</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TenantDashboard;
