import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, DollarSign, Users, PlusCircle, Home, Bed, Calendar, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useOwnerProperties } from "@/hooks/use-properties";
import { useOwnerLeases } from "@/hooks/use-leases";
import { PropertyCard } from "@/components/PropertyCard";
import { LeaseCard } from "@/components/LeaseCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

const OwnerDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Property form state
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyCity, setPropertyCity] = useState("");
  const [propertyState, setPropertyState] = useState("");
  const [propertyZip, setPropertyZip] = useState("");
  const [propertyType, setPropertyType] = useState<"Flat" | "PG" | "Hostel">("Flat");
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  
  // Room form state
  const [selectedPropertyForRoom, setSelectedPropertyForRoom] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [roomRent, setRoomRent] = useState("");
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  
  // Bed form state
  const [selectedPropertyForBed, setSelectedPropertyForBed] = useState("");
  const [selectedRoomForBed, setSelectedRoomForBed] = useState("");
  const [bedNumber, setBedNumber] = useState("");
  const [showBedDialog, setShowBedDialog] = useState(false);
  
  // Fetch data
  const { data: ownerPropertiesData = [], isLoading: loadingProperties, refetch: refetchProperties } = useOwnerProperties(profile?.user_id || "");
  const { data: leases = [], isLoading: loadingLeases, refetch: refetchLeases } = useOwnerLeases(profile?.user_id || "");
  
  // Filter owner's properties
  const ownerProperties = (ownerPropertiesData as any[]);
  const approvedProperties = ownerProperties.filter((p: any) => p.is_approved === true);
  const pendingProperties = ownerProperties.filter((p: any) => p.is_approved === false);
  
  // Filter leases
  const pendingLeases = (leases as any[]).filter((l: any) => l.status === 'Pending');
  const activeLeases = (leases as any[]).filter((l: any) => l.status === 'Active');
  
  // Calculate stats
  const totalProperties = ownerProperties.length;
  const activeTenants = activeLeases.length;
  const monthlyIncome = activeLeases.reduce((sum: number, lease: any) => sum + (lease.monthly_rent || 0), 0);

  // Handle add property
  const handleAddProperty = async () => {
    if (!propertyAddress || !propertyCity || !propertyState || !propertyZip) {
      toast({
        title: "Validation Error",
        description: "Please fill in all property details",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("properties")
        .insert({
          owner_id: profile?.user_id,
          address: propertyAddress,
          city: propertyCity,
          state: propertyState,
          zip_code: propertyZip,
          property_type: propertyType,
          is_approved: false, // Requires admin approval
        } as any);

      if (error) throw error;

      toast({
        title: "Property Added! 🏠",
        description: "Your property has been submitted for admin approval.",
      });

      // Reset form
      setPropertyAddress("");
      setPropertyCity("");
      setPropertyState("");
      setPropertyZip("");
      setPropertyType("Flat");
      setShowPropertyDialog(false);
      
      // Refresh properties
      refetchProperties();
    } catch (error: any) {
      toast({
        title: "Failed to Add Property",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Handle add room
  const handleAddRoom = async () => {
    if (!selectedPropertyForRoom || !roomNumber || !roomRent) {
      toast({
        title: "Validation Error",
        description: "Please fill in all room details",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("rooms")
        .insert({
          property_id: selectedPropertyForRoom,
          room_number: roomNumber,
          rent_price: parseFloat(roomRent),
          is_occupied: false,
        } as any);

      if (error) throw error;

      toast({
        title: "Room Added! 🚪",
        description: `Room ${roomNumber} has been added successfully.`,
      });

  // Reset form
      setSelectedPropertyForRoom("");
      setRoomNumber("");
      setRoomRent("");
      setShowRoomDialog(false);
      
      // Refresh properties (to get updated rooms)
      refetchProperties();
    } catch (error: any) {
      toast({
        title: "Failed to Add Room",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Handle add bed
  const handleAddBed = async () => {
    if (!selectedRoomForBed || !bedNumber) {
      toast({
        title: "Validation Error",
        description: "Please fill in all bed details",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("beds")
        .insert({
          room_id: selectedRoomForBed,
          bed_number: bedNumber,
          is_occupied: false,
        } as any);

      if (error) throw error;

      toast({
        title: "Bed Added! 🛏️",
        description: `Bed ${bedNumber} has been added successfully.`,
      });

  // Reset form
  setSelectedPropertyForBed("");
  setSelectedRoomForBed("");
      setBedNumber("");
      setShowBedDialog(false);
      
      // Refresh properties
      refetchProperties();
    } catch (error: any) {
      toast({
        title: "Failed to Add Bed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Handle lease approval
  const handleApproveLease = async (leaseId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("leases")
        .update({ status: 'Active' })
        .eq("lease_id", leaseId);

      if (error) throw error;

      toast({
        title: "Lease Approved! ✅",
        description: "The tenant has been notified.",
      });

      refetchLeases();
    } catch (error: any) {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Handle lease rejection
  const handleRejectLease = async (leaseId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("leases")
        .update({ status: 'Terminated' })
        .eq("lease_id", leaseId);

      if (error) throw error;

      toast({
        title: "Lease Rejected",
        description: "The application has been rejected.",
      });

      refetchLeases();
    } catch (error: any) {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Owner Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.first_name}! Manage your properties and tenants
          </p>
        </div>

        {/* Account Status Alert removed: verification no longer required */}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Properties</CardDescription>
              <CardTitle className="text-2xl">{totalProperties}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Tenants</CardDescription>
              <CardTitle className="text-2xl">{activeTenants}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Monthly Income</CardDescription>
              <CardTitle className="text-2xl">${monthlyIncome.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending Applications</CardDescription>
              <CardTitle className="text-2xl">{pendingLeases.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="leases">Lease Applications</TabsTrigger>
            <TabsTrigger value="tenants">Active Tenants</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>My Properties</CardTitle>
                      <CardDescription>Manage your listings</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    {approvedProperties.length} approved, {pendingProperties.length} pending
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setActiveTab("properties")}
                  >
                    View Properties
                  </Button>
                </CardContent>
              </Card>

              <Dialog open={showPropertyDialog} onOpenChange={setShowPropertyDialog}>
                <DialogTrigger asChild>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                          <PlusCircle className="w-5 h-5 text-success" />
                        </div>
                        <div>
                          <CardTitle>Add Property</CardTitle>
                          <CardDescription>List a new property</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">Expand your rental business</p>
                      <Button className="w-full">Add New Property</Button>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Property</DialogTitle>
                    <DialogDescription>
                      Enter property details. Admin approval required.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        placeholder="123 Main Street"
                        value={propertyAddress}
                        onChange={(e) => setPropertyAddress(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          placeholder="New York"
                          value={propertyCity}
                          onChange={(e) => setPropertyCity(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          placeholder="NY"
                          value={propertyState}
                          onChange={(e) => setPropertyState(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input
                        id="zip"
                        placeholder="10001"
                        value={propertyZip}
                        onChange={(e) => setPropertyZip(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Property Type</Label>
                      <Select value={propertyType} onValueChange={(value: any) => setPropertyType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Flat">Flat</SelectItem>
                          <SelectItem value="PG">PG (Paying Guest)</SelectItem>
                          <SelectItem value="Hostel">Hostel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowPropertyDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddProperty}>
                      Add Property
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Lease Applications</CardTitle>
                      <CardDescription>Review tenant requests</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    {pendingLeases.length} applications waiting for review
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setActiveTab("leases")}
                  >
                    Review Applications
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <CardTitle>Active Tenants</CardTitle>
                      <CardDescription>View current tenants</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    {activeTenants} tenants, ${monthlyIncome.toLocaleString()}/month
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setActiveTab("tenants")}
                  >
                    View Tenants
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      My Properties
                    </CardTitle>
                    <CardDescription>Manage your property listings</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={showRoomDialog} onOpenChange={(open) => { setShowRoomDialog(open); if (!open) { setSelectedPropertyForRoom(""); setRoomNumber(""); setRoomRent(""); } }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Home className="w-4 h-4 mr-2" />
                          Add Room
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Room</DialogTitle>
                          <DialogDescription>Add a room to one of your properties</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="selectProperty">Select Property</Label>
                            <Select value={selectedPropertyForRoom} onValueChange={setSelectedPropertyForRoom}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a property..." />
                              </SelectTrigger>
                              <SelectContent>
                                {ownerProperties.map((property: any) => (
                                  <SelectItem key={property.property_id} value={property.property_id}>
                                    {property.address}, {property.city}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="roomNumber">Room Number</Label>
                            <Input
                              id="roomNumber"
                              placeholder="e.g., 101"
                              value={roomNumber}
                              onChange={(e) => setRoomNumber(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="rentPrice">Monthly Rent ($)</Label>
                            <Input
                              id="rentPrice"
                              type="number"
                              placeholder="1200"
                              value={roomRent}
                              onChange={(e) => setRoomRent(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowRoomDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddRoom}>
                            Add Room
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={showBedDialog} onOpenChange={(open) => { setShowBedDialog(open); if (!open) { setSelectedPropertyForBed(""); setSelectedRoomForBed(""); setBedNumber(""); } }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Bed className="w-4 h-4 mr-2" />
                          Add Bed
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Bed</DialogTitle>
                          <DialogDescription>Add a bed to a room (for PG/Hostel)</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="selectBedProperty">Select Property</Label>
                            <Select value={selectedPropertyForBed} onValueChange={(val) => { setSelectedPropertyForBed(val); setSelectedRoomForBed(""); }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a property..." />
                              </SelectTrigger>
                              <SelectContent>
                                {ownerProperties.map((property: any) => (
                                  <SelectItem key={property.property_id} value={property.property_id}>
                                    {property.address}, {property.city}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="selectRoom">Select Room</Label>
                            <Select value={selectedRoomForBed} onValueChange={setSelectedRoomForBed}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a room..." />
                              </SelectTrigger>
                              <SelectContent>
                                {(
                                  (ownerProperties.find((p: any) => p.property_id === selectedPropertyForBed)?.rooms as any[]) || []
                                ).map((room: any) => (
                                  <SelectItem key={room.room_id} value={room.room_id}>
                                    Room {room.room_number} - ${room.rent_price}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="bedNumber">Bed Number</Label>
                            <Input
                              id="bedNumber"
                              placeholder="e.g., Bed 1"
                              value={bedNumber}
                              onChange={(e) => setBedNumber(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowBedDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddBed}>
                            Add Bed
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button size="sm" onClick={() => setShowPropertyDialog(true)}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Property
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingProperties ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading properties...
                  </div>
                ) : ownerProperties.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No properties yet</p>
                    <Button className="mt-4" onClick={() => setShowPropertyDialog(true)}>
                      Add Your First Property
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingProperties.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm text-muted-foreground">
                          Pending Approval ({pendingProperties.length})
                        </h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {pendingProperties.map((property: any) => (
                            <div key={property.property_id} className="relative">
                              <PropertyCard property={property} />
                              <Badge className="absolute top-2 right-2" variant="secondary">
                                Pending
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {approvedProperties.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm text-muted-foreground">
                          Approved ({approvedProperties.length})
                        </h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {approvedProperties.map((property: any) => (
                            <PropertyCard key={property.property_id} property={property} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lease Applications Tab */}
          <TabsContent value="leases" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Lease Applications
                </CardTitle>
                <CardDescription>Review and approve tenant applications</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingLeases ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading applications...
                  </div>
                ) : pendingLeases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No pending applications</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingLeases.map((lease: any) => (
                      <div key={lease.lease_id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">
                              New Lease Application
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Submitted on {new Date(lease.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="secondary">Pending</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Lease Period</p>
                            <p className="font-medium">
                              {new Date(lease.start_date).toLocaleDateString()} - {new Date(lease.end_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Monthly Rent</p>
                            <p className="font-medium">${lease.monthly_rent.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveLease(lease.lease_id)}
                            className="flex-1"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectLease(lease.lease_id)}
                            className="flex-1"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Tenants Tab */}
          <TabsContent value="tenants" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Active Tenants
                </CardTitle>
                <CardDescription>View current tenants and their leases</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingLeases ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading tenants...
                  </div>
                ) : activeLeases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No active tenants yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeLeases.map((lease: any) => (
                      <LeaseCard key={lease.lease_id} lease={lease} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default OwnerDashboard;
