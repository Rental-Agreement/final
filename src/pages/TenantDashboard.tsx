import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, CreditCard, FileText, AlertCircle, Search, Building2, Calendar, DollarSign, Filter } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTenantLeases } from "@/hooks/use-leases";
import { usePaymentMethods, useLeaseTransactions } from "@/hooks/use-payments";
import { useAllDisputes } from "@/hooks/use-disputes";
import { useProperties } from "@/hooks/use-properties";
import type { TablesInsert } from "@/integrations/supabase/types";
import { useFavorites } from "@/hooks/useFavorites";
import { PropertyCard } from "@/components/PropertyCard";
import { LeaseCard } from "@/components/LeaseCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import type { PropertyFilters } from "@/hooks/use-properties";
import { usePropertyReviews, useCreateReview } from "@/hooks/use-reviews";
import { useDebounce } from "@/hooks/use-debounce";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatINR } from "@/lib/utils";
import { PropertyComparisonModal } from "@/components/PropertyComparisonModal";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { RecentlyViewedSection } from "@/components/RecentlyViewedSection";
import { SaveSearchDialog } from "@/components/SaveSearchDialog";
import { FilterChips } from "@/components/FilterChips";
import { ImageCarouselWithThumbnails } from "@/components/ImageCarouselWithThumbnails";
import { useTrackPropertyView } from "@/hooks/use-property-views";

const TenantDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const trackView = useTrackPropertyView();
  
  // Filters/search state
  const [searchText, setSearchText] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searchType, setSearchType] = useState<string>("All");
  const [priceRange, setPriceRange] = useState<number[]>([0, 50000]);
  const [minRating, setMinRating] = useState<string>("0");
  const [sortBy, setSortBy] = useState<PropertyFilters["sort"]>("rating_desc");
  const [amenities, setAmenities] = useState<{ wifi: boolean; elevator: boolean; geyser: boolean; ac: boolean; parking: boolean }>({
    wifi: false,
    elevator: false,
    geyser: false,
    ac: false,
    parking: false,
  });
  const [starsMin, setStarsMin] = useState<string>("0");
  const [freeCancellation, setFreeCancellation] = useState(false);
  const [payAtProperty, setPayAtProperty] = useState(false);
  const [breakfastIncluded, setBreakfastIncluded] = useState(false);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | undefined>(undefined);
  const debouncedSearch = useDebounce(searchText, 350);
  
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
  const { data: properties = [], isLoading: loadingProperties } = useProperties({
    city: searchCity || undefined,
    type: searchType,
    search: debouncedSearch || undefined,
    minPrice: priceRange?.[0],
    maxPrice: priceRange?.[1],
    minRating: Number(minRating) || undefined,
    amenities: (Object.entries(amenities).filter(([_, v]) => v).map(([k]) => k) as any) as PropertyFilters["amenities"],
    starsMin: Number(starsMin) || undefined,
    freeCancellation,
    payAtProperty,
    breakfastIncluded,
    maxDistanceKm,
    sort: sortBy,
  });
  const { data: leases = [], isLoading: loadingLeases } = useTenantLeases(profile?.user_id || "");
  const { data: paymentMethods = [] } = usePaymentMethods(profile?.user_id || "");
  const { data: transactions = [] } = useLeaseTransactions(selectedLeaseForPayment || (leases as any)[0]?.lease_id || "");
  const { data: disputes = [] } = useAllDisputes();
  const { data: favorites = [], refetch: refetchFavorites, isFetching: isFetchingFavorites } = useFavorites(profile?.user_id || "");
  // Property details modal state
  const [detailsProperty, setDetailsProperty] = useState<any | null>(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const { data: reviews = [] } = usePropertyReviews(detailsProperty?.property_id);
  const createReview = useCreateReview();
  const [newRating, setNewRating] = useState<string>("");
  const [newComment, setNewComment] = useState<string>("");
  // Add/remove favorite logic
  const handleToggleFavorite = async (propertyId: string) => {
    if (!profile?.user_id) return;
    const favorite = favorites.find((f: any) => f.property_id === propertyId);
    try {
      if (favorite) {
        // Remove favorite
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", profile.user_id)
          .eq("property_id", propertyId);
        if (error) throw error;
        toast({ title: "Removed from favorites", description: "Property removed from your favorites." });
      } else {
        // Add favorite
          const { error } = await (supabase as any)
            .from('favorites')
            .insert({ user_id: profile.user_id, property_id: propertyId });
        if (error) throw error;
        toast({ title: "Added to favorites", description: "Property added to your favorites." });
      }
      refetchFavorites();
    } catch (err: any) {
      toast({ title: "Favorite action failed", description: err.message || String(err), variant: "destructive" });
    }
  };

  // Already filtered by backend; keep as-is for rendering
  const filteredProperties = (properties as any[]);

  // Get active leases
  const activeLeases = (leases as any[]).filter((l: any) => l.status === 'Active');
  const pendingLeases = (leases as any[]).filter((l: any) => l.status === 'Pending');

  // Calculate stats
  const currentRent = (activeLeases as any[])[0]?.monthly_rent || 0;
  const nextPaymentDate = (activeLeases as any[])[0]?.start_date || 'N/A';
  const activeLeaseEndDate = (activeLeases as any[])[0]?.end_date || 'N/A';

  // Handle lease application
  const handleApplyForLease = async (propertyId: string) => {
    if (!propertyId || !leaseStart || !leaseEnd) {
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
          property_id: propertyId,
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
      <div className="space-y-6 relative bg-app-radial rounded-2xl p-2 md:p-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Tenant Dashboard</h1>
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
                    {filteredProperties.length} properties available
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
            {/* Sticky Filters Bar */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b py-1">
              <div className="flex flex-wrap items-center gap-2 max-w-7xl mx-auto px-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-32 sm:w-40 md:w-48 h-8 text-sm" />
                <Input placeholder="City" value={searchCity} onChange={(e) => setSearchCity(e.target.value)} className="w-24 h-8 text-sm" />
                <Select value={searchType} onValueChange={setSearchType}><SelectTrigger className="h-8 text-sm w-28"><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="All">All Types</SelectItem><SelectItem value="Flat">Flat</SelectItem><SelectItem value="PG">PG</SelectItem><SelectItem value="Hostel">Hostel</SelectItem></SelectContent></Select>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}><SelectTrigger className="h-8 text-sm w-28"><SelectValue placeholder="Sort" /></SelectTrigger><SelectContent><SelectItem value="rating_desc">Top rated</SelectItem><SelectItem value="price_asc">Price: Low to High</SelectItem><SelectItem value="price_desc">Price: High to Low</SelectItem><SelectItem value="distance_asc">Distance: Closest</SelectItem><SelectItem value="newest">Newest</SelectItem></SelectContent></Select>
                <Select value={minRating} onValueChange={setMinRating}><SelectTrigger className="h-8 text-sm w-20"><SelectValue placeholder="Min Rating" /></SelectTrigger><SelectContent><SelectItem value="0">Any</SelectItem><SelectItem value="3">3.0+</SelectItem><SelectItem value="4">4.0+</SelectItem><SelectItem value="4.5">4.5+</SelectItem></SelectContent></Select>
                <Select value={starsMin} onValueChange={setStarsMin}><SelectTrigger className="h-8 text-sm w-20"><SelectValue placeholder="Stars" /></SelectTrigger><SelectContent><SelectItem value="0">Any</SelectItem><SelectItem value="1">1★+</SelectItem><SelectItem value="2">2★+</SelectItem><SelectItem value="3">3★+</SelectItem><SelectItem value="4">4★+</SelectItem><SelectItem value="5">5★</SelectItem></SelectContent></Select>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">₹{priceRange[0]} - ₹{priceRange[1]}</Label>
                  <Slider min={0} max={100000} step={500} value={priceRange} onValueChange={setPriceRange} className="w-32" />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Dist: {typeof maxDistanceKm === 'number' ? `${maxDistanceKm}km` : 'Any'}</Label>
                  <Slider min={1} max={25} step={0.5} value={[typeof maxDistanceKm === 'number' ? maxDistanceKm : 10]} onValueChange={(v) => setMaxDistanceKm(v?.[0])} className="w-24" />
                </div>
                {/* Amenities Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs">Amenities</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="grid grid-cols-2 gap-2">
                      {(["wifi","ac","geyser","elevator","parking"] as const).map((key) => (
                        <label key={key} className="flex items-center gap-2 text-xs whitespace-nowrap cursor-pointer">
                          <Checkbox checked={amenities[key]} onCheckedChange={(v) => setAmenities((prev) => ({ ...prev, [key]: Boolean(v) }))} />
                          <span className="capitalize">{key}</span>
                        </label>
                      ))}
                      <label className="flex items-center gap-2 text-xs whitespace-nowrap cursor-pointer">
                        <Checkbox checked={freeCancellation} onCheckedChange={(v) => setFreeCancellation(Boolean(v))} />
                        <span>Free cancellation</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs whitespace-nowrap cursor-pointer">
                        <Checkbox checked={payAtProperty} onCheckedChange={(v) => setPayAtProperty(Boolean(v))} />
                        <span>Pay at property</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs whitespace-nowrap cursor-pointer">
                        <Checkbox checked={breakfastIncluded} onCheckedChange={(v) => setBreakfastIncluded(Boolean(v))} />
                        <span>Breakfast included</span>
                      </label>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setSearchText(""); setSearchCity(""); setSearchType("All"); setPriceRange([0,50000]); setMinRating("0"); setStarsMin("0"); setFreeCancellation(false); setPayAtProperty(false); setBreakfastIncluded(false); setMaxDistanceKm(undefined); setSortBy("rating_desc"); setAmenities({wifi:false,elevator:false,geyser:false,ac:false,parking:false}); }}>
                  Reset
                </Button>
                <SaveSearchDialog
                  currentFilters={{
                    city: searchCity,
                    type: searchType,
                    search: debouncedSearch,
                    minPrice: priceRange[0],
                    maxPrice: priceRange[1],
                    minRating: Number(minRating),
                    amenities: Object.entries(amenities).filter(([_, v]) => v).map(([k]) => k),
                    starsMin: Number(starsMin),
                    freeCancellation,
                    payAtProperty,
                    breakfastIncluded,
                    maxDistanceKm,
                    sort: sortBy,
                  }}
                />
              </div>
            </div>

            {/* Filter Chips */}
            <div className="max-w-7xl mx-auto px-2 mb-4">
              <FilterChips
                filters={{
                  search: debouncedSearch,
                  city: searchCity,
                  type: searchType !== "All" ? searchType : undefined,
                  minPrice: priceRange[0] !== 0 ? priceRange[0] : undefined,
                  maxPrice: priceRange[1] !== 50000 ? priceRange[1] : undefined,
                  minRating: Number(minRating) || undefined,
                  starsMin: Number(starsMin) || undefined,
                  maxDistanceKm,
                  amenities: Object.entries(amenities).filter(([_, v]) => v).map(([k]) => k),
                  freeCancellation,
                  payAtProperty,
                  breakfastIncluded,
                }}
                onRemoveFilter={(key) => {
                  if (key === "search") setSearchText("");
                  else if (key === "city") setSearchCity("");
                  else if (key === "type") setSearchType("All");
                  else if (key === "price") setPriceRange([0, 50000]);
                  else if (key === "minRating") setMinRating("0");
                  else if (key === "starsMin") setStarsMin("0");
                  else if (key === "maxDistanceKm") setMaxDistanceKm(undefined);
                  else if (key === "wifi") setAmenities((prev) => ({ ...prev, wifi: false }));
                  else if (key === "ac") setAmenities((prev) => ({ ...prev, ac: false }));
                  else if (key === "geyser") setAmenities((prev) => ({ ...prev, geyser: false }));
                  else if (key === "elevator") setAmenities((prev) => ({ ...prev, elevator: false }));
                  else if (key === "parking") setAmenities((prev) => ({ ...prev, parking: false }));
                  else if (key === "freeCancellation") setFreeCancellation(false);
                  else if (key === "payAtProperty") setPayAtProperty(false);
                  else if (key === "breakfastIncluded") setBreakfastIncluded(false);
                }}
                onClearAll={() => {
                  setSearchText("");
                  setSearchCity("");
                  setSearchType("All");
                  setPriceRange([0, 50000]);
                  setMinRating("0");
                  setStarsMin("0");
                  setFreeCancellation(false);
                  setPayAtProperty(false);
                  setBreakfastIncluded(false);
                  setMaxDistanceKm(undefined);
                  setSortBy("rating_desc");
                  setAmenities({ wifi: false, elevator: false, geyser: false, ac: false, parking: false });
                }}
              />
            </div>

            {/* Recently Viewed Section */}

            {/* Results */}
            <div className="mb-6 max-w-7xl mx-auto">
              {loadingProperties ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1,2,3,4,5,6].map((i) => (
                    <div key={i} className="bg-white rounded-xl shadow-md h-full">
                      <Skeleton className="h-48 w-full rounded-t-xl" />
                      <div className="p-4 space-y-3">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-6 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex gap-2">
                          <Skeleton className="h-9 w-24" />
                          <Skeleton className="h-9 w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredProperties.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No properties found matching your criteria</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProperties.map((property: any) => {
                    const isFavorite = favorites.some((f: any) => f.property_id === property.property_id);
                    return (
                      <PropertyCard
                        key={property.property_id}
                        property={property}
                        onView={() => { 
                          setDetailsProperty(property); 
                          setShowApplyForm(false);
                          trackView.mutate(property.property_id);
                        }}
                        onApply={() => handleApplyForLease(property.property_id)}
                        isFavorite={isFavorite}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
          {/* Property Details Modal */}
          <Dialog open={!!detailsProperty} onOpenChange={(open) => { if (!open) { setDetailsProperty(null); setShowApplyForm(false); } }}>
            <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 sm:p-0">
              {detailsProperty && (
                <div className="w-full h-full overflow-y-auto">
                  {/* Sticky Image Carousel Section with Thumbnails */}
                  <div className="relative bg-black/5 pt-6 pb-2">
                    <ImageCarouselWithThumbnails 
                      images={detailsProperty.images && detailsProperty.images.length > 0 ? detailsProperty.images : ['/placeholder.jpg']}
                      alt={detailsProperty.address || "Property"}
                    />
                  </div>

                  {/* Scrollable Content Area */}
                  <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
                      {/* Property Header */}
                      <div className="mb-6">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-2">
                          <div>
                            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{detailsProperty.address}</h1>
                            <p className="text-sm sm:text-base text-muted-foreground">
                              {detailsProperty.address}, {detailsProperty.city}, {detailsProperty.state}, {detailsProperty.zip_code}
                            </p>
                          </div>
                          <button
                            className="px-3 sm:px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50 text-sm"
                            onClick={async () => {
                              try {
                                const slug = detailsProperty.slug || detailsProperty.property_id;
                                const url = `${window.location.origin}/property/${slug}`;
                                if ((navigator as any).share) {
                                  await (navigator as any).share({ title: detailsProperty.address, url });
                                } else if (navigator.clipboard?.writeText) {
                                  await navigator.clipboard.writeText(url);
                                  toast({ title: "Link copied", description: "Shareable link copied to clipboard" });
                                }
                              } catch (e) {
                                toast({ title: "Share failed", description: String(e), variant: "destructive" });
                              }
                            }}
                          >
                            <span>🔗</span> Share
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="bg-black text-white text-xs px-2 py-1 rounded">Company-Serviced</span>
                          <div className="flex items-center gap-2">
                            <span className="bg-green-600 text-white px-3 py-1 rounded font-bold">{detailsProperty.rating || 4.5} ★</span>
                            <span className="text-sm text-muted-foreground">{detailsProperty.rating_count || 0} Ratings</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Details */}
                        <div className="lg:col-span-2 space-y-8">
                          {/* Amenities */}
                          <div>
                            <h2 className="text-xl sm:text-2xl font-bold mb-4">Amenities</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                              {detailsProperty.wifi_available && (
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">📶</span>
                                  <span>Free Wifi</span>
                                </div>
                              )}
                              {detailsProperty.amenities?.ac && (
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">❄️</span>
                                  <span>AC</span>
                                </div>
                              )}
                              {detailsProperty.amenities?.geyser && (
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">🚿</span>
                                  <span>Geyser</span>
                                </div>
                              )}
                              {detailsProperty.amenities?.elevator && (
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">🛗</span>
                                  <span>Elevator</span>
                                </div>
                              )}
                              {detailsProperty.amenities?.parking && (
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">🅿️</span>
                                  <span>Parking</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* About */}
                          {detailsProperty.custom_specs?.description && (
                            <div>
                              <h2 className="text-xl sm:text-2xl font-bold mb-4">About this Property</h2>
                              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{detailsProperty.custom_specs.description}</p>
                            </div>
                          )}

                          {/* Choose Your Room */}
                          <div>
                            <h2 className="text-xl sm:text-2xl font-bold mb-4">Choose your room</h2>
                            <div className="space-y-3">
                              {(detailsProperty.rooms || []).length === 0 && (
                                <p className="text-muted-foreground">No rooms available at the moment.</p>
                              )}
                              {(detailsProperty.rooms || []).map((r: any) => (
                                <div key={r.room_id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                                  <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3">
                                    <div className="flex-1">
                                      <h3 className="font-bold text-base sm:text-lg mb-1">Room {r.room_number}</h3>
                                      <div className="text-sm text-muted-foreground mb-2">
                                        {r.description || detailsProperty.property_type}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-1 rounded ${r.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                          {r.status}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-left sm:text-right w-full sm:w-auto">
                                      <div className="text-xl sm:text-2xl font-bold mb-1">₹{Number(r.rent_price || 0)}</div>
                                      <div className="text-xs text-muted-foreground mb-2 sm:mb-3">per month</div>
                                      <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                                        onClick={() => {
                                          setSelectedRoomId(r.room_id);
                                          setMonthlyRent(String(r.rent_price || detailsProperty.price_per_room || ''));
                                          setShowApplyForm(true);
                                        }}
                                        disabled={r.status !== 'Available'}
                                      >
                                        {r.status === 'Available' ? 'Book Now' : 'Occupied'}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Location & Nearby */}
                          <div>
                            <h2 className="text-xl sm:text-2xl font-bold mb-4">Location</h2>
                            <div className="border rounded-lg p-3 sm:p-4">
                              <div className="flex items-start gap-3 mb-4">
                                <span className="text-xl">📍</span>
                                <div>
                                  <p className="font-medium mb-1 text-sm sm:text-base">{detailsProperty.address}</p>
                                  <p className="text-xs sm:text-sm text-muted-foreground">{detailsProperty.city}, {detailsProperty.state} {detailsProperty.zip_code}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <h4 className="font-semibold text-sm mb-2 text-red-600">Places to visit</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">City Center</span>
                                      <span className="font-medium">2.0kms</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Railway Station</span>
                                      <span className="font-medium">4.8kms</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm mb-2">Transportation</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Bus Stop</span>
                                      <span className="font-medium">0.5kms</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Airport</span>
                                      <span className="font-medium">15kms</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <a
                                className="text-sm text-red-600 font-medium hover:underline inline-flex items-center gap-1"
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detailsProperty.address + ', ' + detailsProperty.city + ', ' + detailsProperty.state + ' ' + detailsProperty.zip_code)}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Click here to view on map →
                              </a>
                            </div>
                          </div>

                          {/* House Rules */}
                          <div>
                            <h2 className="text-xl sm:text-2xl font-bold mb-4">House Rules</h2>
                            <ul className="list-disc list-inside space-y-2 text-sm sm:text-base text-muted-foreground">
                              <li>Government ID required at check-in</li>
                              <li>No smoking in rooms</li>
                              <li>Pets not allowed</li>
                              <li>Quiet hours: 10 PM - 6 AM</li>
                              {detailsProperty.timings && <li>Check-in/out: {detailsProperty.timings}</li>}
                            </ul>
                          </div>

                          {/* Reviews */}
                          <div>
                            <h2 className="text-xl sm:text-2xl font-bold mb-4">Reviews</h2>
                            {reviews.length === 0 ? (
                              <p className="text-muted-foreground">No reviews yet. Be the first to review.</p>
                            ) : (
                              <div className="space-y-3">
                                {reviews.slice(0, 5).map((rev: any) => (
                                  <div key={rev.review_id} className="border rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium">Rating: {rev.rating} ★</span>
                                      <span className="text-xs text-muted-foreground">{new Date(rev.created_at).toLocaleDateString()}</span>
                                    </div>
                                    {rev.comment && <p className="text-sm text-muted-foreground">{rev.comment}</p>}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add Review */}
                            <div className="mt-4 border-t pt-4 space-y-2">
                              <Label htmlFor="rating" className="text-sm">Your rating</Label>
                              <Select value={newRating} onValueChange={setNewRating}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select rating" />
                                </SelectTrigger>
                                <SelectContent>
                                  {[5,4.5,4,3.5,3,2.5,2,1.5,1].map((r) => (
                                    <SelectItem key={r} value={String(r)}>{r} ★</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Label htmlFor="comment" className="text-sm">Comment (optional)</Label>
                              <Textarea id="comment" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Share your experience..." />
                              <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  const r = Number(newRating);
                                  if (!r || r < 1 || r > 5) {
                                    toast({ title: "Select rating", description: "Please choose a rating between 1 and 5.", variant: "destructive" });
                                    return;
                                  }
                                  createReview.mutate({ property_id: detailsProperty.property_id, rating: r, comment: newComment || undefined });
                                  setNewRating("");
                                  setNewComment("");
                                }}
                              >
                                Submit Review
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Right Column - Booking Card (Sticky) */}
                        <div className="lg:col-span-1">
                          <div className="lg:sticky lg:top-6 glass rounded-2xl p-4 sm:p-6 shadow-lg">
                            <div className="mb-4">
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-2xl sm:text-3xl font-bold">{formatINR(detailsProperty.price_per_room || 0)}</span>
                                <span className="text-xs sm:text-sm text-muted-foreground">/ room / month</span>
                              </div>
                              <p className="text-xs text-muted-foreground">+ taxes & fees: {formatINR(Math.round((detailsProperty.price_per_room || 0) * 0.12))}</p>
                            </div>

                            {!showApplyForm ? (
                              <Button className="w-full btn-gradient text-base sm:text-lg py-5 sm:py-6" onClick={() => setShowApplyForm(true)}>
                                Continue to Book
                              </Button>
                            ) : (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="startDate" className="text-sm font-medium">Move-in Date</Label>
                                  <Input
                                    id="startDate"
                                    type="date"
                                    value={leaseStart}
                                    onChange={(e) => setLeaseStart(e.target.value)}
                                    className="w-full"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="endDate" className="text-sm font-medium">Move-out Date</Label>
                                  <Input
                                    id="endDate"
                                    type="date"
                                    value={leaseEnd}
                                    onChange={(e) => setLeaseEnd(e.target.value)}
                                    className="w-full"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="monthlyRent" className="text-sm font-medium">Monthly Rent</Label>
                                  <Input
                                    id="monthlyRent"
                                    type="number"
                                    placeholder="Enter amount"
                                    value={monthlyRent}
                                    onChange={(e) => setMonthlyRent(e.target.value)}
                                    className="w-full"
                                  />
                                </div>
                                <div className="border-t pt-4 space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Monthly Rent</span>
                                    <span>{formatINR(Number(monthlyRent) || 0)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Taxes & fees (12%)</span>
                                    <span>{formatINR(Math.round((Number(monthlyRent) || 0) * 0.12))}</span>
                                  </div>
                                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                                    <span>Total</span>
                                    <span>{formatINR(Math.round((Number(monthlyRent) || 0) * 1.12))}</span>
                                  </div>
                                </div>
                                <Button 
                                  className="w-full btn-gradient py-6" 
                                  onClick={() => handleApplyForLease(detailsProperty.property_id)}
                                >
                                  Apply for Lease
                                </Button>
                                <Button variant="outline" className="w-full" onClick={() => setShowApplyForm(false)}>
                                  Cancel
                                </Button>
                              </div>
                            )}

                            <div className="mt-6 pt-6 border-t space-y-3">
                              <div className="flex items-center gap-2 text-sm">
                                <span>🔒</span>
                                <span className="text-muted-foreground">Safe & Secure payments</span>
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <div className="flex items-center gap-2 text-sm text-red-600 font-medium cursor-pointer hover:underline">
                                    <span>ℹ️</span>
                                    <span>Cancellation Policy</span>
                                  </div>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Cancellation Policy</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      - Free cancellation up to 24 hours before move-in. <br />
                                      - 50% refund if cancelled within 24 hours of move-in date. <br />
                                      - No refund after move-in.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Close</AlertDialogCancel>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              )}
            </DialogContent>
          </Dialog>

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
      {/* Property Comparison Modal (fixed at bottom when items added) */}
      <PropertyComparisonModal />
    </DashboardLayout>
  );
};

export default TenantDashboard;
