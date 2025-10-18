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
import { Building2, CheckCircle, XCircle, Users, FileText, Home } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

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

  // Fetch all users for user management
  const { data: allUsers = [], isLoading: loadingUsers, error: usersError } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
        // Use RPC function to bypass RLS policies
        const { data, error } = await supabase.rpc("get_all_users");
      
        if (error) {
          console.error("Error fetching users:", error);
          throw error;
        }
      return data;
    },
  });

  // Fetch disputes with full details (lease, tenant, owner, property)
  const { data: enhancedDisputes = [], isLoading: loadingEnhancedDisputes } = useQuery({
    queryKey: ["enhanced-disputes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disputes")
        .select(`
          *,
          raised_by:users!disputes_raised_by_user_id_fkey(first_name, last_name, email, role),
          transactions(
            transaction_id,
            amount,
            payment_method,
            leases(
              lease_id,
              lease_start,
              lease_end,
              rent,
              tenant:users!leases_tenant_id_fkey(first_name, last_name, email),
              properties(
                property_id,
                property_type,
                address,
                city,
                state,
                owner:users!properties_owner_id_fkey(first_name, last_name, email)
              )
            )
          )
        `)
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

  // Analytics data via RPC
  const { data: analytics, isLoading: loadingAnalytics, error: analyticsError } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_analytics");
      if (error) throw error;
      return data as any;
    },
  });

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
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  All Disputes
                </CardTitle>
                <CardDescription>Manage and resolve disputes raised by tenants and owners</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingEnhancedDisputes ? (
                  <div className="text-center py-8 text-muted-foreground">Loading disputes...</div>
                ) : enhancedDisputes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No disputes found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enhancedDisputes.map((dispute: any) => {
                      const transaction = dispute.transactions;
                      const lease = transaction?.leases;
                      const property = lease?.properties;
                      const tenant = lease?.tenant;
                      const owner = property?.owner;

                      return (
                        <Card key={dispute.dispute_id} className="border p-4">
                          <div className="space-y-3">
                            {/* Dispute Header */}
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg">Dispute #{dispute.dispute_id.slice(0, 8)}</h3>
                                  <Badge variant={
                                    dispute.status === 'Resolved' ? 'default' :
                                    dispute.status === 'In Review' ? 'secondary' :
                                    'outline'
                                  }>
                                    {dispute.status}
                                  </Badge>
                                </div>
                                <p className="text-sm">{dispute.description}</p>
                              </div>
                              <div className="flex gap-2 ml-4">
                                {dispute.status !== 'Resolved' && (
                                  <Button size="sm" onClick={() => handleStatusChange(dispute.dispute_id, 'Resolved')}>
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Resolve
                                  </Button>
                                )}
                                {dispute.status !== 'In Review' && (
                                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(dispute.dispute_id, 'In Review')}>
                                    In Review
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Dispute Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Raised By</p>
                                <p className="text-sm font-medium">
                                  {dispute.raised_by?.first_name} {dispute.raised_by?.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {dispute.raised_by?.email} • {dispute.raised_by?.role}
                                </p>
                              </div>
                              
                              {property && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Property</p>
                                  <p className="text-sm font-medium">{property.property_type}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {property.address}, {property.city}, {property.state}
                                  </p>
                                </div>
                              )}

                              {tenant && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Tenant</p>
                                  <p className="text-sm font-medium">
                                    {tenant.first_name} {tenant.last_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{tenant.email}</p>
                                </div>
                              )}

                              {owner && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Owner</p>
                                  <p className="text-sm font-medium">
                                    {owner.first_name} {owner.last_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{owner.email}</p>
                                </div>
                              )}

                              {lease && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Lease Details</p>
                                  <p className="text-sm font-medium">
                                    ${lease.rent}/month
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(lease.lease_start).toLocaleDateString()} - {new Date(lease.lease_end).toLocaleDateString()}
                                  </p>
                                </div>
                              )}

                              {transaction && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Transaction</p>
                                  <p className="text-sm font-medium">${transaction.amount}</p>
                                  <p className="text-xs text-muted-foreground">{transaction.payment_method}</p>
                                </div>
                              )}
                            </div>

                            {/* Resolution */}
                            {dispute.resolution && (
                              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <p className="font-medium text-sm mb-1 text-green-900 dark:text-green-100">Resolution:</p>
                                <p className="text-sm text-green-800 dark:text-green-200">{dispute.resolution}</p>
                              </div>
                            )}

                            {/* Timestamp */}
                            <p className="text-xs text-muted-foreground">
                              Raised: {new Date(dispute.created_at).toLocaleDateString()} at {new Date(dispute.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Key metrics and trends for your platform</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsError ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTitle>Analytics unavailable</AlertTitle>
                    <AlertDescription>
                      {String((analyticsError as any)?.message || analyticsError)}<br />
                      Ensure you have run the SQL in <code>supabase/admin_analytics.sql</code> and that your account role is <strong>Admin</strong>. Then reload the page.
                    </AlertDescription>
                  </Alert>
                ) : loadingAnalytics ? (
                  <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>
                ) : analytics ? (
                  <div className="space-y-8">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="p-4">
                        <p className="text-sm text-muted-foreground">Total Users</p>
                        <p className="text-2xl font-bold">{analytics.kpis.total_users}</p>
                      </Card>
                      <Card className="p-4">
                        <p className="text-sm text-muted-foreground">Approved Properties</p>
                        <p className="text-2xl font-bold">{analytics.kpis.properties_approved}</p>
                      </Card>
                      <Card className="p-4">
                        <p className="text-sm text-muted-foreground">Active Leases</p>
                        <p className="text-2xl font-bold">{analytics.kpis.leases_active}</p>
                      </Card>
                      <Card className="p-4">
                        <p className="text-sm text-muted-foreground">Revenue (All-time)</p>
                        <p className="text-2xl font-bold">₹{Number(analytics.kpis.revenue_total).toLocaleString()}</p>
                      </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="p-4">
                        <p className="text-sm font-medium mb-2">Revenue by Month</p>
                        {(!analytics.revenue || analytics.revenue.length === 0) ? (
                          <div className="text-muted-foreground py-8">No revenue data yet.</div>
                        ) : (
                        <ChartContainer config={{ revenue: { label: "Revenue", color: "hsl(220 70% 50%)" } }}>
                          <LineChart data={analytics.revenue}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line type="monotone" dataKey="value" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ChartContainer>
                        )}
                      </Card>

                      <Card className="p-4">
                        <p className="text-sm font-medium mb-2">New Users by Month</p>
                        {(!analytics.users || analytics.users.length === 0) ? (
                          <div className="text-muted-foreground py-8">No user signup data yet.</div>
                        ) : (
                        <ChartContainer config={{ users: { label: "Users", color: "hsl(140 70% 40%)" } }}>
                          <LineChart data={analytics.users}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line type="monotone" dataKey="value" stroke="var(--color-users)" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ChartContainer>
                        )}
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">No analytics available.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Management
                </CardTitle>
                <CardDescription>View and manage all registered users</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="text-center py-8 text-muted-foreground">Loading users...</div>
                ) : allUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No users found</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Registered</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allUsers.map((user: any) => (
                          <TableRow key={user.user_id}>
                            <TableCell className="font-medium">
                              {user.first_name} {user.last_name}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.phone_number || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={
                                user.role === 'Admin' ? 'default' :
                                user.role === 'Owner' ? 'secondary' :
                                'outline'
                              }>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                {/* User Statistics */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Users</p>
                        <p className="text-2xl font-bold">{allUsers.length}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                        <Home className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Owners</p>
                        <p className="text-2xl font-bold">
                          {allUsers.filter((u: any) => u.role === 'Owner').length}
                        </p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                        <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tenants</p>
                        <p className="text-2xl font-bold">
                          {allUsers.filter((u: any) => u.role === 'Tenant').length}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
