import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, CreditCard, FileText, AlertCircle, Search, Building2, Calendar, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTenantLeases } from "@/hooks/use-leases";
import { usePaymentMethods, useLeaseTransactions } from "@/hooks/use-payments";
import { useAllDisputes } from "@/hooks/use-disputes";
import { useProperties } from "@/hooks/use-properties";
import { PropertyCard } from "@/components/PropertyCard";
import { LeaseCard } from "@/components/LeaseCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

const TenantDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Property search state
  const [searchCity, setSearchCity] = useState("");
  const [searchType, setSearchType] = useState<string>("All");
  const [maxRent, setMaxRent] = useState("");
  
  // Lease application state
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedBedId, setSelectedBedId] = useState("");
  const [leaseStart, setLeaseStart] = useState("");
  const [leaseEnd, setLeaseEnd] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  
  // Payment state
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [selectedLeaseForPayment, setSelectedLeaseForPayment] = useState("");
  
  // Dispute state
  const [disputeLeaseId, setDisputeLeaseId] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  
  // Fetch data
  const { data: properties = [], isLoading: loadingProperties } = useProperties();
  const { data: leases = [], isLoading: loadingLeases } = useTenantLeases(profile?.user_id || "");
  const { data: paymentMethods = [] } = usePaymentMethods(profile?.user_id || "");
  const { data: transactions = [] } = useLeaseTransactions(selectedLeaseForPayment || (leases as any)[0]?.lease_id || "");
  const { data: disputes = [] } = useAllDisputes();

  // Filter properties
  const approvedProperties = properties.filter((p: any) => p.is_approved === true);
  const filteredProperties = approvedProperties.filter((property: any) => {
    const matchesCity = !searchCity || property.city?.toLowerCase().includes(searchCity.toLowerCase());
    const matchesType = searchType === "All" || property.property_type === searchType;
    return matchesCity && matchesType;
  });

  // Get active leases
  const activeLeases = (leases as any[]).filter((l: any) => l.status === 'Active');
  const pendingLeases = (leases as any[]).filter((l: any) => l.status === 'Pending');

  // Calculate stats
  const currentRent = (activeLeases as any[])[0]?.monthly_rent || 0;
  const nextPaymentDate = (activeLeases as any[])[0]?.start_date || 'N/A';
  const activeLeaseEndDate = (activeLeases as any[])[0]?.end_date || 'N/A';

  // Handle lease application
  const handleApplyForLease = async () => {
    if (!selectedPropertyId || !leaseStart || !leaseEnd) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("leases")
        .insert({
          tenant_id: profile?.user_id,
          property_id: selectedPropertyId,
          room_id: selectedRoomId || null,
          bed_id: selectedBedId || null,
          start_date: leaseStart,
          end_date: leaseEnd,
          monthly_rent: parseFloat(monthlyRent) || 0,
          status: 'Pending',
        } as any);

      if (error) throw error;

      toast({
        title: "Application Submitted! 🎉",
        description: "Your lease application has been submitted and is pending approval.",
      });

      // Reset form
      setSelectedPropertyId("");
      setSelectedRoomId("");
      setSelectedBedId("");
      setLeaseStart("");
      setLeaseEnd("");
      setMonthlyRent("");
    } catch (error: any) {
      toast({
        title: "Application Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Handle payment
  const handleMakePayment = async () => {
    if (!selectedLeaseForPayment || !paymentAmount || !selectedPaymentMethod) {
      toast({
        title: "Validation Error",
        description: "Please fill in all payment details",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("transactions")
        .insert({
          lease_id: selectedLeaseForPayment,
          amount: parseFloat(paymentAmount),
          payment_date: new Date().toISOString().split('T')[0],
          payment_method_id: selectedPaymentMethod,
          status: 'Completed',
        } as any);

      if (error) throw error;

      toast({
        title: "Payment Successful! 💰",
        description: `Payment of $${paymentAmount} has been processed.`,
      });

      // Reset form
      setSelectedLeaseForPayment("");
      setPaymentAmount("");
      setSelectedPaymentMethod("");
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Handle dispute submission
  const handleRaiseDispute = async () => {
    if (!disputeLeaseId || !disputeDescription) {
      toast({
        title: "Validation Error",
        description: "Please select a lease and describe the issue",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("disputes")
        .insert({
          lease_id: disputeLeaseId,
          raised_by: profile?.user_id,
          description: disputeDescription,
          status: 'Open',
        } as any);

      if (error) throw error;

      toast({
        title: "Dispute Raised 📢",
        description: "Your dispute has been submitted and will be reviewed.",
      });

      // Reset form
      setDisputeLeaseId("");
      setDisputeDescription("");
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout role="tenant">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tenant Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.first_name}! Manage your rentals and payments
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Current Rent</CardDescription>
              <CardTitle className="text-2xl">
                ${currentRent.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Leases</CardDescription>
              <CardTitle className="text-2xl">{activeLeases.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending Applications</CardDescription>
              <CardTitle className="text-2xl">{pendingLeases.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Payments</CardDescription>
              <CardTitle className="text-2xl">{transactions.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="browse">Browse Properties</TabsTrigger>
            <TabsTrigger value="leases">My Leases</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Search className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Browse Properties</CardTitle>
                      <CardDescription>Find your next home</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    {approvedProperties.length} properties available
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={() => setActiveTab("browse")}
                  >
                    Search Now
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <CardTitle>My Leases</CardTitle>
                      <CardDescription>View your rentals</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    {activeLeases.length} active, {pendingLeases.length} pending
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setActiveTab("leases")}
                  >
                    View Leases
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Make Payment</CardTitle>
                      <CardDescription>Pay your rent</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    {paymentMethods.length} payment methods saved
                  </p>
                  <Button 
                    className="w-full"
                    onClick={() => setActiveTab("payments")}
                  >
                    Pay Now
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <CardTitle>Disputes</CardTitle>
                      <CardDescription>Report issues</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    {disputes.filter((d: any) => d.status === 'Open').length} open disputes
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setActiveTab("disputes")}
                  >
                    View Disputes
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Browse Properties Tab */}
          <TabsContent value="browse" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search Properties
                </CardTitle>
                <CardDescription>Find available properties to rent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Search by city..."
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Property Type</Label>
                    <Select value={searchType} onValueChange={setSearchType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Types</SelectItem>
                        <SelectItem value="Flat">Flat</SelectItem>
                        <SelectItem value="PG">PG</SelectItem>
                        <SelectItem value="Hostel">Hostel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxRent">Max Rent</Label>
                    <Input
                      id="maxRent"
                      type="number"
                      placeholder="Enter max rent"
                      value={maxRent}
                      onChange={(e) => setMaxRent(e.target.value)}
                    />
                  </div>
                </div>

                {loadingProperties ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading properties...
                  </div>
                ) : filteredProperties.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No properties found matching your criteria</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProperties.map((property: any) => (
                      <Dialog key={property.property_id}>
                        <DialogTrigger asChild>
                          <div className="cursor-pointer">
                            <PropertyCard property={property} />
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Apply for Lease</DialogTitle>
                            <DialogDescription>
                              Submit an application to rent this property
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                  id="startDate"
                                  type="date"
                                  value={leaseStart}
                                  onChange={(e) => setLeaseStart(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                  id="endDate"
                                  type="date"
                                  value={leaseEnd}
                                  onChange={(e) => setLeaseEnd(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="monthlyRent">Monthly Rent</Label>
                              <Input
                                id="monthlyRent"
                                type="number"
                                placeholder="Enter monthly rent"
                                value={monthlyRent}
                                onChange={(e) => setMonthlyRent(e.target.value)}
                              />
                            </div>
                            <Button
                              className="w-full"
                              onClick={() => {
                                setSelectedPropertyId(property.property_id);
                                handleApplyForLease();
                              }}
                            >
                              Submit Application
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Leases Tab */}
          <TabsContent value="leases" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  My Leases
                </CardTitle>
                <CardDescription>View and manage your rental agreements</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingLeases ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading leases...
                  </div>
                ) : leases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No leases yet</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setActiveTab("browse")}
                    >
                      Browse Properties
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leases.map((lease: any) => (
                      <LeaseCard key={lease.lease_id} lease={lease} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Make Payment Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Make Payment
                  </CardTitle>
                  <CardDescription>Pay your monthly rent</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="leaseSelect">Select Lease</Label>
                    <Select 
                      value={selectedLeaseForPayment} 
                      onValueChange={setSelectedLeaseForPayment}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a lease..." />
                      </SelectTrigger>
                      <SelectContent>
                        {activeLeases.map((lease: any) => (
                          <SelectItem key={lease.lease_id} value={lease.lease_id}>
                            Lease - ${lease.monthly_rent}/month
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select 
                      value={selectedPaymentMethod} 
                      onValueChange={setSelectedPaymentMethod}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose payment method..." />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method: any) => (
                          <SelectItem key={method.payment_method_id} value={method.payment_method_id}>
                            {method.method_type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Need to add a payment method? Contact support.
                  </div>
                  <Button className="w-full" onClick={handleMakePayment}>
                    Pay Now
                  </Button>
                </CardContent>
              </Card>

              {/* Payment History Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Payment History
                  </CardTitle>
                  <CardDescription>Your transaction records</CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No payments yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.slice(0, 5).map((transaction: any) => (
                        <div 
                          key={transaction.transaction_id}
                          className="flex justify-between items-center p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">${transaction.amount}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(transaction.payment_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge 
                            variant={
                              transaction.status === 'Completed' ? 'default' : 
                              transaction.status === 'Pending' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Disputes Tab */}
          <TabsContent value="disputes" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Raise Dispute Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Raise a Dispute
                  </CardTitle>
                  <CardDescription>Report an issue with your lease</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="disputeLease">Select Lease</Label>
                    <Select value={disputeLeaseId} onValueChange={setDisputeLeaseId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a lease..." />
                      </SelectTrigger>
                      <SelectContent>
                        {leases.map((lease: any) => (
                          <SelectItem key={lease.lease_id} value={lease.lease_id}>
                            Lease - ${lease.monthly_rent}/month
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the issue in detail..."
                      value={disputeDescription}
                      onChange={(e) => setDisputeDescription(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <Button className="w-full" onClick={handleRaiseDispute}>
                    Submit Dispute
                  </Button>
                </CardContent>
              </Card>

              {/* Active Disputes Card */}
              <Card>
                <CardHeader>
                  <CardTitle>My Disputes</CardTitle>
                  <CardDescription>Track your submitted issues</CardDescription>
                </CardHeader>
                <CardContent>
                  {disputes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No disputes raised</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {disputes.map((dispute: any) => (
                        <div 
                          key={dispute.dispute_id}
                          className="p-3 border rounded-lg space-y-2"
                        >
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-medium line-clamp-2">
                              {dispute.description}
                            </p>
                            <Badge 
                              variant={
                                dispute.status === 'Resolved' ? 'default' : 
                                dispute.status === 'In Progress' ? 'secondary' : 
                                'outline'
                              }
                            >
                              {dispute.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(dispute.created_at).toLocaleDateString()}
                          </p>
                          {dispute.resolution && (
                            <div className="mt-2 p-2 bg-muted rounded text-sm">
                              <p className="font-medium">Resolution:</p>
                              <p className="text-muted-foreground">{dispute.resolution}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default TenantDashboard;
