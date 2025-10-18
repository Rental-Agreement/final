import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAllDisputes, useUpdateDispute } from "@/hooks/use-disputes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building2, CheckCircle, XCircle } from "lucide-react";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("properties");
  const { data: disputes = [], isLoading } = useAllDisputes();
  const updateDispute = useUpdateDispute();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending properties
  const { data: pendingProperties = [], isLoading: loadingProperties } = useQuery({
    queryKey: ["pending-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*, owner:users!properties_owner_id_fkey(first_name, last_name, email)")
        .eq("is_approved", false)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleApproveProperty = async (propertyId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("properties")
        .update({ is_approved: true })
        .eq("property_id", propertyId);

      if (error) throw error;

      toast({
        title: "Property Approved! ✅",
        description: "The property is now visible to tenants.",
      });

      queryClient.invalidateQueries({ queryKey: ["pending-properties"] });
    } catch (error: any) {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRejectProperty = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("property_id", propertyId);

      if (error) throw error;

      toast({
        title: "Property Rejected",
        description: "The property has been removed.",
      });

      queryClient.invalidateQueries({ queryKey: ["pending-properties"] });
    } catch (error: any) {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
            <TabsTrigger value="properties">Property Approvals</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          <TabsContent value="properties">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Pending Property Approvals
                </CardTitle>
                <CardDescription>Review and approve properties submitted by owners</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingProperties ? (
                  <div className="text-center py-8 text-muted-foreground">Loading properties...</div>
                ) : pendingProperties.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No pending property approvals</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingProperties.map((property: any) => (
                      <Card key={property.property_id} className="border p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{property.property_type}</h3>
                              <Badge variant="secondary">Pending</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              <strong>Address:</strong> {property.address}, {property.city}, {property.state} {property.zip_code}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Owner:</strong> {property.owner?.first_name} {property.owner?.last_name} ({property.owner?.email})
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Submitted: {new Date(property.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => handleApproveProperty(property.property_id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectProperty(property.property_id)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
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
