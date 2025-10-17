import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAllDisputes, useUpdateDispute } from "@/hooks/use-disputes";
import { Badge } from "@/components/ui/badge";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("disputes");
  const { data: disputes = [], isLoading } = useAllDisputes();
  const updateDispute = useUpdateDispute();

  const handleStatusChange = (disputeId: string, status: "Open" | "In Review" | "Resolved" | "Rejected") => {
    updateDispute.mutate({ id: disputeId, updates: { status } });
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform oversight and management</p>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          <TabsContent value="disputes">
            <Card>
              <CardHeader>
                <CardTitle>All Disputes</CardTitle>
                <CardDescription>Manage and resolve disputes raised by tenants and owners</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div>Loading disputes...</div>
                ) : disputes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No disputes found</div>
                ) : (
                  <div className="space-y-4">
                    {disputes.map((dispute: any) => (
                      <Card key={dispute.dispute_id} className="border p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{dispute.description}</div>
                            <Badge className="ml-2" variant={
                              dispute.status === 'Resolved' ? 'default' :
                              dispute.status === 'In Review' ? 'secondary' :
                              'outline'
                            }>
                              {dispute.status}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            {dispute.status !== 'Resolved' && (
                              <Button size="sm" onClick={() => handleStatusChange(dispute.dispute_id, 'Resolved')}>Resolve</Button>
                            )}
                            {dispute.status !== 'In Review' && (
                              <Button size="sm" variant="outline" onClick={() => handleStatusChange(dispute.dispute_id, 'In Review')}>Mark In Review</Button>
                            )}
                          </div>
                        </div>
                        {dispute.resolution && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <p className="font-medium">Resolution:</p>
                            <p className="text-muted-foreground">{dispute.resolution}</p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">Raised: {new Date(dispute.created_at).toLocaleDateString()}</p>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Platform analytics and statistics (coming soon)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground">Analytics features will be added here.</div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all users (coming soon)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground">User management features will be added here.</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
