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
import { Building2, CheckCircle, XCircle, Users, FileText, Home, Search, Filter, Download, TrendingUp, AlertCircle, Clock, DollarSign, Eye, ImageIcon, Trash2, UserCheck, UserX } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("properties");
  const { data: disputes = [], isLoading } = useAllDisputes();
  const updateDispute = useUpdateDispute();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search and filter states
  const [propertySearch, setPropertySearch] = useState("");
  const [approvedPropertySearch, setApprovedPropertySearch] = useState("");
  const [disputeSearch, setDisputeSearch] = useState("");
  const [disputeStatusFilter, setDisputeStatusFilter] = useState("All");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("All");
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [showPropertyDetails, setShowPropertyDetails] = useState(false);

  // Fetch pending properties (is_approved = false, NOT null which means rejected)
  const { data: pendingProperties = [], isLoading: loadingProperties } = useQuery({
    queryKey: ["pending-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*, owner:users!properties_owner_id_fkey(first_name, last_name, email)")
        .eq("is_approved", false)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      // Filter out rejected (null) properties on the client side
      return data?.filter((p: any) => p.is_approved === false) || [];
    },
  });

  // Fetch approved properties with owner and tenant information
  const { data: approvedProperties = [], isLoading: loadingApprovedProperties, error: approvedPropertiesError } = useQuery({
    queryKey: ["approved-properties"],
    queryFn: async () => {
      console.log("Fetching approved properties...");
      
      // First, get all approved properties with owner info
      const { data: properties, error: propError } = await supabase
        .from("properties")
        .select(`
          *,
          owner:users!properties_owner_id_fkey(user_id, first_name, last_name, email),
          rooms(room_id)
        `)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      
      if (propError) {
        console.error("Error fetching properties:", propError);
        throw propError;
      }
      
      console.log("Approved properties:", properties?.length);
      
      // For each property, fetch active leases through rooms
      if (properties && properties.length > 0) {
        const propertiesWithLeases = await Promise.all(
          (properties as any[]).map(async (property: any) => {
            const roomIds = property.rooms?.map((r: any) => r.room_id) || [];
            
            if (roomIds.length === 0) {
              return { ...property, leases: [] };
            }
            
            // Get leases for all rooms in this property
            const { data: leases, error: leasesError } = await supabase
              .from("leases")
              .select(`
                lease_id,
                start_date,
                end_date,
                status,
                room_id,
                tenant:users!leases_tenant_id_fkey(user_id, first_name, last_name, email)
              `)
              .in("room_id", roomIds)
              .eq("status", "Active");
            
            if (leasesError) {
              console.error("Error fetching leases for property:", property.property_id, leasesError);
              return { ...property, leases: [] };
            }
            
            console.log(`Property ${property.property_id}: ${leases?.length || 0} active leases`);
            return { ...property, leases: leases || [] };
          })
        );
        
        return propertiesWithLeases;
      }
      
      return properties || [];
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

  // Fetch disputes with user information
  const { data: enhancedDisputes = [], isLoading: loadingEnhancedDisputes, error: disputesError } = useQuery({
    queryKey: ["enhanced-disputes"],
    queryFn: async () => {
      console.log("Fetching disputes...");
      
      const { data, error } = await supabase
        .from("disputes")
        .select(`
          *,
          raised_by:users!disputes_raised_by_user_id_fkey(user_id, first_name, last_name, email, role)
        `)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching disputes:", error);
        throw error;
      }
      
      console.log("Disputes fetched:", data?.length);
      return data || [];
    },
  });

  const handleApproveProperty = async (propertyId: string) => {
    console.log("Approve button clicked for property:", propertyId);
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
      console.error("Error approving property:", error);
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRejectProperty = async (propertyId: string) => {
    console.log("Reject button clicked for property:", propertyId);
    try {
      // Set is_approved to NULL to mark as rejected (different from false = pending)
      const { error } = await (supabase as any)
        .from("properties")
        .update({ is_approved: null })
        .eq("property_id", propertyId);

      if (error) throw error;

      toast({
        title: "Property Rejected ✗",
        description: "The property has been marked as rejected and removed from pending list.",
      });

      // Invalidate both queries to update UI immediately
      queryClient.invalidateQueries({ queryKey: ["pending-properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      
      // Optimistically remove from UI for instant feedback
      queryClient.setQueryData(["pending-properties"], (old: any) => 
        old ? old.filter((p: any) => p.property_id !== propertyId) : []
      );
    } catch (error: any) {
      console.error("Error rejecting property:", error);
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
      // Try v2 first (uses created_at only). If missing, attempt legacy function.
      const v2: any = await (supabase as any).rpc("admin_get_analytics_v2");
      if (!v2.error && v2.data) return v2.data;

      const legacy: any = await (supabase as any).rpc("admin_get_analytics");
      if (!legacy.error && legacy.data) return legacy.data;

      // Prefer v2 error message if available
      throw (v2.error || legacy.error);
    },
  });

  // Filter functions
  const filteredProperties = pendingProperties.filter((property: any) => {
    const searchLower = propertySearch.toLowerCase();
    return (
      property.type?.toLowerCase().includes(searchLower) ||
      property.address_line_1?.toLowerCase().includes(searchLower) ||
      property.city?.toLowerCase().includes(searchLower) ||
      property.owner?.first_name?.toLowerCase().includes(searchLower) ||
      property.owner?.last_name?.toLowerCase().includes(searchLower) ||
      property.owner?.email?.toLowerCase().includes(searchLower)
    );
  });

  const filteredApprovedProperties = approvedProperties.filter((property: any) => {
    const searchLower = approvedPropertySearch.toLowerCase();
    return (
      property.type?.toLowerCase().includes(searchLower) ||
      property.address_line_1?.toLowerCase().includes(searchLower) ||
      property.city?.toLowerCase().includes(searchLower) ||
      property.owner?.first_name?.toLowerCase().includes(searchLower) ||
      property.owner?.last_name?.toLowerCase().includes(searchLower) ||
      property.owner?.email?.toLowerCase().includes(searchLower) ||
      property.leases?.some((lease: any) => 
        lease.tenant?.first_name?.toLowerCase().includes(searchLower) ||
        lease.tenant?.last_name?.toLowerCase().includes(searchLower) ||
        lease.tenant?.email?.toLowerCase().includes(searchLower)
      )
    );
  });

  const filteredDisputes = enhancedDisputes.filter((dispute: any) => {
    const searchLower = disputeSearch.toLowerCase();
    const matchesSearch = (
      dispute.description?.toLowerCase().includes(searchLower) ||
      dispute.dispute_id?.toLowerCase().includes(searchLower) ||
      dispute.raised_by?.first_name?.toLowerCase().includes(searchLower) ||
      dispute.raised_by?.last_name?.toLowerCase().includes(searchLower) ||
      dispute.raised_by?.email?.toLowerCase().includes(searchLower)
    );
    const matchesStatus = disputeStatusFilter === "All" || dispute.status === disputeStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = allUsers.filter((user: any) => {
    const searchLower = userSearch.toLowerCase();
    const matchesSearch = (
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.phone_number?.toLowerCase().includes(searchLower)
    );
    const matchesRole = userRoleFilter === "All" || user.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Export functions
  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).join(","));
    const csv = [headers, ...rows].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({ title: "Export successful", description: `${filename} exported to CSV` });
  };

  const handleBulkApprove = async () => {
    try {
      const propertyIds = filteredProperties.map((p: any) => p.property_id);
      
      for (const id of propertyIds) {
        await (supabase as any)
          .from("properties")
          .update({ is_approved: true })
          .eq("property_id", id);
      }

      toast({
        title: `${propertyIds.length} Properties Approved! ✅`,
        description: "All filtered properties are now visible to tenants.",
      });

      queryClient.invalidateQueries({ queryKey: ["pending-properties"] });
    } catch (error: any) {
      toast({
        title: "Bulk approval failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewPropertyDetails = (property: any) => {
    setSelectedProperty(property);
    setShowPropertyDetails(true);
    console.log("Property images:", property.images); // Debug log
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform oversight and management</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries()}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Refresh All
            </Button>
          </div>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Pending Approvals</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{pendingProperties.length}</p>
                </div>
                <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Open Disputes</p>
                  <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                    {enhancedDisputes.filter((d: any) => d.status === 'Open').length}
                  </p>
                </div>
                <div className="p-3 bg-amber-200 dark:bg-amber-800 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Approved Properties</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{approvedProperties.length}</p>
                </div>
                <div className="p-3 bg-green-200 dark:bg-green-800 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Users</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{allUsers.length}</p>
                </div>
                <div className="p-3 bg-purple-200 dark:bg-purple-800 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList>
            <TabsTrigger value="properties">Property Approvals</TabsTrigger>
            <TabsTrigger value="approved">Approved Properties</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          <TabsContent value="properties">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Pending Property Approvals
                    </CardTitle>
                    <CardDescription>Review and approve properties submitted by owners</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {filteredProperties.length > 0 && (
                      <Button size="sm" onClick={handleBulkApprove}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve All ({filteredProperties.length})
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => exportToCSV(pendingProperties, 'pending_properties')}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
                {/* Search Bar */}
                <div className="flex gap-2 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by address, city, owner name or email..."
                      value={propertySearch}
                      onChange={(e) => setPropertySearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingProperties ? (
                  <div className="text-center py-8 text-muted-foreground">Loading properties...</div>
                ) : filteredProperties.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{propertySearch ? 'No properties match your search' : 'No pending property approvals'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProperties.map((property: any) => (
                      <Card key={property.property_id} className="group bg-white rounded-xl shadow-md hover:shadow-xl ring-1 ring-border hover:ring-primary/20 transition-all duration-300 overflow-hidden flex flex-col h-full transform hover:scale-[1.01] active:scale-[.99]">
                        {/* Cover Image */}
                        <div className="relative h-48 bg-gray-100 overflow-hidden cursor-pointer" onClick={() => handleViewPropertyDetails(property)}>
                          {property.images && property.images.length > 0 ? (
                            <>
                              <img
                                src={property.images[0]}
                                alt="Property"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                loading="lazy"
                                decoding="async"
                              />
                              {/* Gradient overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
                            </>
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                              No Image
                            </div>
                          )}
                          
                          {/* Status Badge */}
                          <div className="absolute top-3 left-3 bg-amber-500 text-white backdrop-blur rounded-full px-3 py-1 shadow-md text-xs font-medium">
                            Pending Approval
                          </div>
                          
                          {/* Image Count Badge */}
                          {property.images && property.images.length > 0 && (
                            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur rounded-full px-3 py-1 shadow-md flex items-center gap-1.5">
                              <ImageIcon className="w-3 h-3 text-primary" />
                              <span className="text-xs font-medium text-gray-700">{property.images.length} photo{property.images.length !== 1 ? 's' : ''}</span>
                            </div>
                          )}

                          {/* Click to view badge */}
                          <div className="absolute bottom-3 right-3 bg-black/70 text-white backdrop-blur rounded-full px-3 py-1 shadow-md text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to view all
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 pb-5 flex flex-col flex-1">
                          {/* Title & Location */}
                          <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1" title={property.type}>
                            {property.type}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1" title={`${property.address_line_1}, ${property.city}, ${property.state}`}>
                            {property.address_line_1}
                          </p>
                          <p className="text-xs text-gray-500 mb-3">
                            {property.city}, {property.state}
                          </p>

                          {/* Owner Info */}
                          <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Owner</p>
                            <p className="text-sm font-medium">{property.owner?.first_name} {property.owner?.last_name}</p>
                            <p className="text-xs text-muted-foreground">{property.owner?.email}</p>
                          </div>

                          {/* Price & Details */}
                          <div className="mb-3">
                            <div className="font-bold text-xl text-primary">₹{property.price_per_room?.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">per room per month</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {property.rooms?.length || 0} rooms available
                            </div>
                          </div>

                          {/* Submitted Date */}
                          <p className="text-xs text-muted-foreground mb-3">
                            Submitted: {new Date(property.created_at).toLocaleDateString()}
                          </p>

                          {/* Spacer to push buttons to bottom */}
                          <div className="flex-1"></div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 mt-auto">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => handleViewPropertyDetails(property)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => handleApproveProperty(property.property_id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="flex-1"
                                onClick={() => handleRejectProperty(property.property_id)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-success" />
                      Approved Properties
                    </CardTitle>
                    <CardDescription>View all approved properties with owner and occupancy details</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => exportToCSV(approvedProperties, 'approved_properties')}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
                {/* Search Bar */}
                <div className="flex gap-2 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by property, owner, or tenant..."
                      value={approvedPropertySearch}
                      onChange={(e) => setApprovedPropertySearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {approvedPropertiesError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error loading approved properties</AlertTitle>
                    <AlertDescription>{approvedPropertiesError.message}</AlertDescription>
                  </Alert>
                )}
                {loadingApprovedProperties ? (
                  <div className="text-center py-8 text-muted-foreground">Loading approved properties...</div>
                ) : approvedProperties.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-2">No approved properties yet</div>
                    <div className="text-sm text-muted-foreground">Properties need to be approved in the "Property Approvals" tab first</div>
                  </div>
                ) : filteredApprovedProperties.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No properties match your search. Found {approvedProperties.length} total approved properties.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Owner Contact</TableHead>
                          <TableHead>Current Tenants</TableHead>
                          <TableHead>Occupancy</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredApprovedProperties.map((property: any) => {
                          const activeLeases = property.leases?.filter((l: any) => l.status === 'Active') || [];
                          const totalRooms = property.total_rooms || 0;
                          const occupiedRooms = activeLeases.length;
                          const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
                          
                          return (
                            <TableRow key={property.property_id}>
                              <TableCell>
                                <div className="font-medium">{property.address_line_1 || property.address}</div>
                                <div className="text-sm text-muted-foreground">{property.city}, {property.state}</div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{property.type}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {property.owner?.first_name} {property.owner?.last_name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    📧 {property.owner?.email}
                                  </div>
                                  {property.owner?.phone && (
                                    <div className="flex items-center gap-1 text-muted-foreground mt-1">
                                      📞 {property.owner?.phone}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {activeLeases.length > 0 ? (
                                  <div className="space-y-1">
                                    {activeLeases.map((lease: any, idx: number) => (
                                      <div key={lease.lease_id} className="text-sm">
                                        <div className="font-medium">
                                          {lease.tenant?.first_name} {lease.tenant?.last_name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {lease.tenant?.email}
                                        </div>
                                        {lease.tenant?.phone && (
                                          <div className="text-xs text-muted-foreground">
                                            {lease.tenant?.phone}
                                          </div>
                                        )}
                                        {idx < activeLeases.length - 1 && <div className="border-t my-1" />}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <Badge variant="secondary">Vacant</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm">
                                    <div className="font-medium">{occupiedRooms}/{totalRooms} Rooms</div>
                                    <div className="text-xs text-muted-foreground">{occupancyRate}% Occupied</div>
                                  </div>
                                  {occupancyRate === 100 ? (
                                    <Badge className="bg-success text-white">Full</Badge>
                                  ) : occupancyRate > 0 ? (
                                    <Badge variant="secondary">Partial</Badge>
                                  ) : (
                                    <Badge variant="outline">Empty</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleViewPropertyDetails(property)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disputes">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      All Disputes
                    </CardTitle>
                    <CardDescription>Manage and resolve disputes raised by tenants and owners</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => exportToCSV(enhancedDisputes, 'disputes')}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
                {/* Search and Filter */}
                <div className="flex gap-2 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search disputes by description, ID, or user..."
                      value={disputeSearch}
                      onChange={(e) => setDisputeSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={disputeStatusFilter} onValueChange={setDisputeStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Status</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Review">In Review</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {disputesError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error loading disputes</AlertTitle>
                    <AlertDescription>{disputesError.message}</AlertDescription>
                  </Alert>
                )}
                {loadingEnhancedDisputes ? (
                  <div className="text-center py-8 text-muted-foreground">Loading disputes...</div>
                ) : enhancedDisputes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No disputes found</p>
                  </div>
                ) : filteredDisputes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No disputes match your criteria. Found {enhancedDisputes.length} total disputes.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredDisputes.map((dispute: any) => (
                      <Card key={dispute.dispute_id} className="border p-4 hover:shadow-md transition-shadow">
                        <div className="space-y-3">
                          {/* Dispute Header */}
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg">
                                  {dispute.title || `Dispute #${dispute.dispute_id.slice(0, 8)}`}
                                </h3>
                                <Badge variant={
                                  dispute.status === 'Resolved' ? 'default' :
                                  dispute.status === 'In Review' ? 'secondary' :
                                  dispute.status === 'Open' ? 'destructive' :
                                  'outline'
                                }>
                                  {dispute.status}
                                </Badge>
                                {dispute.raised_by?.role && (
                                  <Badge variant="outline" className="text-xs">
                                    {dispute.raised_by.role}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{dispute.description}</p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              {dispute.status !== 'Resolved' && (
                                <Button size="sm" onClick={() => handleStatusChange(dispute.dispute_id, 'Resolved')}>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Resolve
                                </Button>
                              )}
                              {dispute.status !== 'In Review' && dispute.status !== 'Resolved' && (
                                <Button size="sm" variant="outline" onClick={() => handleStatusChange(dispute.dispute_id, 'In Review')}>
                                  <Clock className="w-4 h-4 mr-1" />
                                  Review
                                </Button>
                              )}
                              {dispute.status !== 'Rejected' && dispute.status !== 'Resolved' && (
                                <Button size="sm" variant="destructive" onClick={() => handleStatusChange(dispute.dispute_id, 'Rejected')}>
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Dispute Details */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Raised By</p>
                              <p className="text-sm font-medium">
                                {dispute.raised_by?.first_name} {dispute.raised_by?.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {dispute.raised_by?.email}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Created</p>
                              <p className="text-sm font-medium">
                                {new Date(dispute.created_at).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(dispute.created_at).toLocaleTimeString()}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                              <p className="text-sm font-medium">
                                {new Date(dispute.updated_at).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(dispute.updated_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>

                          {/* Resolution Notes (if any) */}
                          {dispute.resolution_notes && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-xs text-green-700 font-semibold mb-1">Resolution Notes</p>
                              <p className="text-sm text-green-900">{dispute.resolution_notes}</p>
                            </div>
                          )}
                        </div>
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Analytics Dashboard
                    </CardTitle>
                    <CardDescription>Key metrics and trends for your platform</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-analytics"] })}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
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
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm font-medium">Revenue by Month</p>
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        {(!analytics.revenue || analytics.revenue.length === 0) ? (
                          <div className="text-center text-muted-foreground py-8">No revenue data yet.</div>
                        ) : (
                        <ChartContainer config={{ revenue: { label: "Revenue (₹)", color: "hsl(142 76% 36%)" } }}>
                          <LineChart data={analytics.revenue}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" fontSize={12} />
                            <YAxis fontSize={12} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line type="monotone" dataKey="value" stroke="var(--color-revenue)" strokeWidth={3} dot={{ fill: "hsl(142 76% 36%)", r: 4 }} />
                          </LineChart>
                        </ChartContainer>
                        )}
                      </Card>

                      <Card className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm font-medium">New Users by Month</p>
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        {(!analytics.users || analytics.users.length === 0) ? (
                          <div className="text-center text-muted-foreground py-8">No user signup data yet.</div>
                        ) : (
                        <ChartContainer config={{ users: { label: "New Users", color: "hsl(221 83% 53%)" } }}>
                          <BarChart data={analytics.users}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" fontSize={12} />
                            <YAxis fontSize={12} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="value" fill="var(--color-users)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ChartContainer>
                        )}
                      </Card>
                    </div>

                    {/* Additional Metrics */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <Card className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">Property Distribution</p>
                          <Building2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="space-y-2 mt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Approved</span>
                            <span className="font-semibold text-green-600">{analytics.kpis.properties_approved}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Pending</span>
                            <span className="font-semibold text-amber-600">{pendingProperties.length}</span>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">Lease Status</p>
                          <FileText className="w-5 h-5 text-cyan-600" />
                        </div>
                        <div className="space-y-2 mt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Active</span>
                            <span className="font-semibold text-green-600">{analytics.kpis.leases_active}</span>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">Dispute Status</p>
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="space-y-2 mt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Open</span>
                            <span className="font-semibold text-red-600">{enhancedDisputes.filter((d: any) => d.status === 'Open').length}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Resolved</span>
                            <span className="font-semibold text-green-600">{enhancedDisputes.filter((d: any) => d.status === 'Resolved').length}</span>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center py-8">No analytics available.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      User Management
                    </CardTitle>
                    <CardDescription>View and manage all registered users</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => exportToCSV(allUsers, 'users')}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
                {/* Search and Filter */}
                <div className="flex gap-2 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users by name, email, or phone..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Roles</SelectItem>
                      <SelectItem value="Tenant">Tenant</SelectItem>
                      <SelectItem value="Owner">Owner</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="text-center py-8 text-muted-foreground">Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{userSearch || userRoleFilter !== "All" ? 'No users match your criteria' : 'No users found'}</p>
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
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user: any) => (
                          <TableRow key={user.user_id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-sm font-semibold">
                                  {user.first_name?.[0]}{user.last_name?.[0]}
                                </div>
                                {user.first_name} {user.last_name}
                              </div>
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
                            <TableCell className="text-right">
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <UserCheck className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                {/* User Statistics */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Total Users</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{filteredUsers.length}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-200 dark:bg-green-800 rounded-lg">
                        <Home className="w-5 h-5 text-green-600 dark:text-green-300" />
                      </div>
                      <div>
                        <p className="text-sm text-green-600 dark:text-green-400">Owners</p>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                          {filteredUsers.filter((u: any) => u.role === 'Owner').length}
                        </p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-200 dark:bg-purple-800 rounded-lg">
                        <Users className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                      </div>
                      <div>
                        <p className="text-sm text-purple-600 dark:text-purple-400">Tenants</p>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                          {filteredUsers.filter((u: any) => u.role === 'Tenant').length}
                        </p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-200 dark:bg-amber-800 rounded-lg">
                        <UserCheck className="w-5 h-5 text-amber-600 dark:text-amber-300" />
                      </div>
                      <div>
                        <p className="text-sm text-amber-600 dark:text-amber-400">Admins</p>
                        <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                          {filteredUsers.filter((u: any) => u.role === 'Admin').length}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Property Details Modal */}
        <Dialog open={showPropertyDetails} onOpenChange={setShowPropertyDetails}>
          <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-y-auto p-6">
            {selectedProperty && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-3xl font-bold">
                    {selectedProperty.is_approved ? 'Approved Property Details' : 'Property Details'}
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    {selectedProperty.is_approved 
                      ? 'View complete property and occupancy information'
                      : 'Review complete property information before approval'
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 mt-6">
                  {/* Image Gallery */}
                  {selectedProperty.images && selectedProperty.images.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-xl">Property Images ({selectedProperty.images.length})</h3>
                        <Badge variant="outline" className="text-sm px-3 py-1">{selectedProperty.images.length} photos</Badge>
                      </div>
                      
                      {/* Main Carousel */}
                      <Carousel className="w-full">
                        <CarouselContent>
                          {selectedProperty.images.map((img: string, idx: number) => (
                            <CarouselItem key={idx}>
                              <div className="relative w-full h-[600px] bg-gray-100 rounded-xl overflow-hidden shadow-lg">
                                <img
                                  src={img}
                                  alt={`Property ${idx + 1}`}
                                  className="w-full h-full object-contain"
                                />
                                <div className="absolute bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-full text-base font-medium">
                                  {idx + 1} / {selectedProperty.images.length}
                                </div>
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        {selectedProperty.images.length > 1 && (
                          <>
                            <CarouselPrevious className="left-4 w-12 h-12" />
                            <CarouselNext className="right-4 w-12 h-12" />
                          </>
                        )}
                      </Carousel>

                      {/* Thumbnail Gallery */}
                      <div className="grid grid-cols-8 gap-3 mt-4">
                        {selectedProperty.images.map((img: string, idx: number) => (
                          <div key={idx} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all shadow-sm hover:shadow-md">
                            <img
                              src={img}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-1 font-medium">
                              {idx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-50" />
                      <p className="text-lg">No images uploaded</p>
                    </div>
                  )}

                  {/* Property Information */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-6 bg-gray-50 rounded-xl">
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">Property Type</h3>
                      <p className="text-lg font-medium">{selectedProperty.type}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">Price per Room</h3>
                      <p className="text-lg font-bold text-primary">₹{selectedProperty.price_per_room?.toLocaleString()}/month</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">Total Rooms</h3>
                      <p className="text-lg font-medium">{selectedProperty.rooms?.length || 0}</p>
                    </div>
                    <div className="col-span-2 md:col-span-3">
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">Full Address</h3>
                      <p className="text-base">{selectedProperty.address_line_1}</p>
                      <p className="text-base">{selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip_code}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">WiFi Available</h3>
                      <p className="text-lg font-medium">{selectedProperty.wifi_available ? 'Yes ✓' : 'No ✗'}</p>
                    </div>
                  </div>

                  {/* Owner Information */}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-xl mb-4">Owner Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-6 bg-blue-50 rounded-xl">
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">Name</h4>
                        <p className="text-lg font-medium">{selectedProperty.owner?.first_name} {selectedProperty.owner?.last_name}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">Email</h4>
                        <p className="text-base">{selectedProperty.owner?.email}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">Phone</h4>
                        <p className="text-base">{selectedProperty.owner?.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Current Tenants / Occupancy Information - Only for approved properties */}
                  {selectedProperty.is_approved && selectedProperty.leases && (
                    <div className="border-t pt-6">
                      <h3 className="font-semibold text-xl mb-4">Current Occupancy</h3>
                      {selectedProperty.leases.length > 0 ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 mb-4">
                            <Badge className="bg-success text-white px-4 py-2 text-base">
                              {selectedProperty.leases.length} Active Lease{selectedProperty.leases.length > 1 ? 's' : ''}
                            </Badge>
                            <span className="text-muted-foreground">
                              {selectedProperty.leases.length} / {selectedProperty.rooms?.length || 0} rooms occupied
                            </span>
                          </div>
                          <div className="grid gap-4">
                            {selectedProperty.leases.map((lease: any, idx: number) => (
                              <div key={lease.lease_id} className="p-6 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h4 className="font-bold text-lg text-emerald-900">
                                      {lease.tenant?.first_name} {lease.tenant?.last_name}
                                    </h4>
                                    <Badge className="mt-2 bg-emerald-600">Active Tenant</Badge>
                                  </div>
                                  <Badge variant="outline" className="text-base px-3 py-1">
                                    Tenant #{idx + 1}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                                    <p className="font-medium">{lease.tenant?.email}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Phone</p>
                                    <p className="font-medium">{lease.tenant?.phone || 'Not provided'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Lease Start</p>
                                    <p className="font-medium">{new Date(lease.start_date).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Lease End</p>
                                    <p className="font-medium">{new Date(lease.end_date).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 bg-gray-50 rounded-xl text-center">
                          <div className="text-4xl mb-3">🏠</div>
                          <p className="text-lg font-semibold text-muted-foreground">Property is Vacant</p>
                          <p className="text-sm text-muted-foreground mt-2">No active leases at this time</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons - Only show for pending properties */}
                  {!selectedProperty.is_approved && (
                    <div className="flex gap-4 pt-6 border-t">
                      <Button
                        size="lg"
                        className="flex-1 text-base py-6"
                        onClick={() => {
                          handleApproveProperty(selectedProperty.property_id);
                          setShowPropertyDetails(false);
                        }}
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Approve Property
                      </Button>
                      <Button
                        size="lg"
                        variant="destructive"
                        className="flex-1 text-base py-6"
                        onClick={() => {
                          handleRejectProperty(selectedProperty.property_id);
                          setShowPropertyDetails(false);
                        }}
                      >
                        <XCircle className="w-5 h-5 mr-2" />
                        Reject Property
                      </Button>
                    </div>
                  )}

                  {/* Close button for approved properties */}
                  {selectedProperty.is_approved && (
                    <div className="flex justify-end pt-6 border-t">
                      <Button
                        size="lg"
                        variant="outline"
                        className="text-base py-6 px-8"
                        onClick={() => setShowPropertyDetails(false)}
                      >
                        Close
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
