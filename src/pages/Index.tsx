import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Shield, ArrowRight, Check, ChevronDown, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useProperties } from "@/hooks/use-properties";
import { PropertyCard } from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageCarouselWithThumbnails } from "@/components/ImageCarouselWithThumbnails";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatINR } from "@/lib/utils";

const Index = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [amenities, setAmenities] = useState<Array<"wifi"|"elevator"|"geyser"|"ac"|"parking">>([]);
  const [sort, setSort] = useState<"price_asc"|"price_desc"|"rating_desc"|"newest"|"distance_asc"|undefined>(undefined);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  
  const toggleAmenity = (key: "wifi"|"elevator"|"geyser"|"ac"|"parking") => {
    setAmenities(prev => prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]);
  };

  const handleViewDetails = async (propertyId: string) => {
    const { data, error } = await supabase
      .from("properties")
      .select("*, rooms(*, beds(*))")
      .eq("property_id", propertyId)
      .single();
    
    if (error) {
      toast({ title: "Error", description: "Failed to load property details", variant: "destructive" });
      return;
    }
    setSelectedProperty(data);
    setDetailsDialogOpen(true);
  };

  const handleBookNow = (propertyId: string) => {
    const property = properties.find((p: any) => p.property_id === propertyId);
    if (!property) return;
    setSelectedProperty(property);
    setBookingDialogOpen(true);
  };

  const { data: properties = [], isLoading } = useProperties({
    search,
    city,
    type,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    minRating: minRating ? Number(minRating) : undefined,
    amenities,
    sort,
  });
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Top-right Auth Buttons */}
      <div className="container mx-auto px-4 pt-4 flex justify-end gap-2">
        <Link to="/auth?tab=signin">
          <Button variant="outline" size="sm">Login</Button>
        </Link>
        <Link to="/auth?tab=signup">
          <Button size="sm">Sign Up</Button>
        </Link>
      </div>
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-block">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Rental Management Platform</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold leading-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Simplify Property Management
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect tenants, owners, and administrators in one seamless platform. 
            Manage properties, process payments, and handle disputes effortlessly.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Link to="/auth?tab=signup">
              <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Tenant Card */}
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>For Tenants</CardTitle>
              <CardDescription>Find and book your perfect space</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success mt-0.5" />
                <span className="text-sm">Browse available properties and rooms</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success mt-0.5" />
                <span className="text-sm">Secure online rent payments</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success mt-0.5" />
                <span className="text-sm">Manage lease agreements</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success mt-0.5" />
                <span className="text-sm">Raise disputes when needed</span>
              </div>
            </CardContent>
          </Card>

          {/* Owner Card */}
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>For Owners</CardTitle>
              <CardDescription>Manage your properties with ease</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success mt-0.5" />
                <span className="text-sm">List properties, rooms, and beds</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success mt-0.5" />
                <span className="text-sm">Approve tenant applications</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success mt-0.5" />
                <span className="text-sm">Receive automated payouts</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success mt-0.5" />
                <span className="text-sm">Track rental income</span>
              </div>
            </CardContent>
          </Card>

          {/* Admin Card */}
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>For Admins</CardTitle>
              <CardDescription>Complete platform oversight</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success mt-0.5" />
                <span className="text-sm">Approve properties and owners</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success mt-0.5" />
                <span className="text-sm">Monitor all transactions</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success mt-0.5" />
                <span className="text-sm">Resolve disputes</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success mt-0.5" />
                <span className="text-sm">Generate system reports</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>


      {/* Public Property Catalog Section */}
      <section className="container mx-auto px-4 py-8 sm:py-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-6 sm:mb-8 text-center gradient-text">Find Your Next Stay</h2>
        {/* Quick Categories Bar (horizontal scroll) */}
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-3 mb-4 sm:mb-6 scrollbar-hide">
          {[
            {label:"Trending", onClick:()=>setSort("rating_desc"), active: sort==="rating_desc"},
            {label:"Budget", onClick:()=>setSort("price_asc"), active: sort==="price_asc"},
            {label:"Newest", onClick:()=>setSort("newest"), active: sort==="newest"},
            {label:"Wifi", onClick:()=>toggleAmenity("wifi"), active: amenities.includes("wifi")},
            {label:"AC", onClick:()=>toggleAmenity("ac"), active: amenities.includes("ac")},
            {label:"Parking", onClick:()=>toggleAmenity("parking"), active: amenities.includes("parking")},
            {label:"Lift", onClick:()=>toggleAmenity("elevator"), active: amenities.includes("elevator")},
          ].map((chip, idx)=> (
            <button
              key={idx}
              onClick={chip.onClick}
              className={`px-4 py-2 rounded-full border transition-all whitespace-nowrap ${chip.active ? 'bg-foreground text-background border-foreground' : 'bg-card hover:bg-accent text-foreground/80 border-border'}`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Filter Chips & Controls */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {city && <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">{city} <button className="ml-2 text-xs" onClick={()=>setCity("")}>×</button></span>}
          {type !== "All" && <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">{type} <button className="ml-2 text-xs" onClick={()=>setType("All")}>×</button></span>}
          {minPrice && <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">Min ₹{minPrice} <button className="ml-2 text-xs" onClick={()=>setMinPrice("")}>×</button></span>}
          {maxPrice && <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">Max ₹{maxPrice} <button className="ml-2 text-xs" onClick={()=>setMaxPrice("")}>×</button></span>}
          {minRating && <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">Min {minRating}★ <button className="ml-2 text-xs" onClick={()=>setMinRating("")}>×</button></span>}
          {amenities.map(a => (
            <span key={a} className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">{a} <button className="ml-2 text-xs" onClick={()=>toggleAmenity(a)}>×</button></span>
          ))}
          {sort && <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">Sort: {sort.replace('_',' ')} <button className="ml-2 text-xs" onClick={()=>setSort(undefined)}>×</button></span>}
        </div>
        <div className="max-w-6xl mx-auto mb-8 flex flex-wrap gap-2 items-center px-2">
          {/* Search Bar */}
          <Input 
            type="text" 
            placeholder="Search destinations..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="flex-1 min-w-[150px] text-sm h-9" 
          />
          
          {/* City Input */}
          <Input 
            type="text" 
            placeholder="City" 
            value={city} 
            onChange={e => setCity(e.target.value)} 
            className="w-32 sm:w-40 text-sm h-9" 
          />

          {/* Property Type Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 h-9 text-sm">
                Property Type <ChevronDown className="w-3 h-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Select Property Type</h4>
                <div className="space-y-2">
                  {["All", "Flat", "PG", "Hostel"].map(t => (
                    <div key={t} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`type-${t}`} 
                        checked={type === t}
                        onCheckedChange={() => setType(t)}
                      />
                      <Label htmlFor={`type-${t}`} className="cursor-pointer text-sm">{t}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Amenities Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 h-9 text-sm">
                Amenities {amenities.length > 0 && `(${amenities.length})`} <ChevronDown className="w-3 h-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Select Amenities</h4>
                <div className="space-y-2">
                  {[
                    { key: "wifi" as const, label: "WiFi" },
                    { key: "ac" as const, label: "AC" },
                    { key: "parking" as const, label: "Parking" },
                    { key: "elevator" as const, label: "Elevator" },
                    { key: "geyser" as const, label: "Geyser" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`amenity-${key}`} 
                        checked={amenities.includes(key)}
                        onCheckedChange={() => toggleAmenity(key)}
                      />
                      <Label htmlFor={`amenity-${key}`} className="cursor-pointer text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Price Range Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 h-9 text-sm whitespace-nowrap">
                Price Range <ChevronDown className="w-3 h-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Price Range (₹/month)</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    type="number" 
                    placeholder="Min" 
                    value={minPrice} 
                    onChange={e => setMinPrice(e.target.value)} 
                    className="h-8 text-sm"
                  />
                  <Input 
                    type="number" 
                    placeholder="Max" 
                    value={maxPrice} 
                    onChange={e => setMaxPrice(e.target.value)} 
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Rating Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 h-9 text-sm">
                Rating {minRating && `(${minRating}★+)`} <ChevronDown className="w-3 h-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Minimum Rating</h4>
                <Input 
                  type="number" 
                  placeholder="e.g., 4.5" 
                  min="0" 
                  max="5" 
                  step="0.1"
                  value={minRating} 
                  onChange={e => setMinRating(e.target.value)} 
                  className="h-8 text-sm"
                />
              </div>
            </PopoverContent>
          </Popover>

          {/* Sort Dropdown */}
          <select 
            value={sort || ''} 
            onChange={e => setSort((e.target.value || undefined) as any)} 
            className="border rounded px-3 py-1.5 bg-background hover:bg-accent transition-colors cursor-pointer text-sm h-9"
          >
            <option value="">Sort by</option>
            <option value="rating_desc">Top rated</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest</option>
          </select>
        </div>
        {/* Featured Properties Horizontal Scroll */}
        {properties.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-4">Featured Properties</h3>
            <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
              {properties.slice(0, 6).map((property: any) => (
                <div key={property.property_id} className="w-[280px] flex-shrink-0">
                  <PropertyCard 
                    property={property} 
                    showActions={true}
                    onView={handleViewDetails}
                    onApply={handleBookNow}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Main Property Grid */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading properties...</div>
        ) : properties.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No properties found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((property: any) => (
              <PropertyCard 
                key={property.property_id} 
                property={property} 
                showActions={true}
                onView={handleViewDetails}
                onApply={handleBookNow}
              />
            ))}
          </div>
        )}
      </section>

      {/* Property Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 sm:p-6">
          <DialogHeader className="px-4 pt-4 sm:px-0 sm:pt-0">
            <DialogTitle className="text-xl sm:text-2xl font-bold gradient-text">
              {selectedProperty?.address || "Property Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedProperty && (
            <div className="space-y-4 sm:space-y-6 px-4 pb-4 sm:px-0 sm:pb-0">
              {/* Image Carousel */}
              {selectedProperty.images && selectedProperty.images.length > 0 && (
                <ImageCarouselWithThumbnails 
                  images={selectedProperty.images} 
                  alt={selectedProperty.address || "Property"} 
                />
              )}
              
              {/* Property Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="font-semibold text-base sm:text-lg mb-2">Location</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">{selectedProperty.city}, {selectedProperty.state}</p>
                  {selectedProperty.neighborhood && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{selectedProperty.neighborhood}</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-base sm:text-lg mb-2">Price</h3>
                  <p className="text-xl sm:text-2xl font-bold text-primary">{formatINR(selectedProperty.price_per_room)}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">per room per month</p>
                </div>
              </div>

              {/* About */}
              {selectedProperty.description && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">About this property</h3>
                  <p className="text-muted-foreground">{selectedProperty.description}</p>
                </div>
              )}

              {/* Amenities */}
              <div>
                <h3 className="font-semibold text-lg mb-2">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProperty.wifi_available && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">WiFi</span>
                  )}
                  {selectedProperty.amenities?.elevator && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">Elevator</span>
                  )}
                  {selectedProperty.amenities?.geyser && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">Geyser</span>
                  )}
                  {selectedProperty.amenities?.ac && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">AC</span>
                  )}
                  {selectedProperty.amenities?.parking && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">Parking</span>
                  )}
                  {selectedProperty.free_cancellation && (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm">Free Cancellation</span>
                  )}
                  {selectedProperty.breakfast_included && (
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm">Breakfast Included</span>
                  )}
                </div>
              </div>

              {/* Rooms */}
              {selectedProperty.rooms && selectedProperty.rooms.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Available Rooms</h3>
                  <div className="space-y-2">
                    {selectedProperty.rooms.map((room: any) => (
                      <div key={room.room_id} className="p-3 border rounded-lg">
                        <p className="font-medium">Room {room.room_number}</p>
                        <p className="text-sm text-muted-foreground">
                          Capacity: {room.capacity} | Status: {room.status}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setDetailsDialogOpen(false)} className="flex-1">
                  Close
                </Button>
                <Button onClick={() => { setDetailsDialogOpen(false); handleBookNow(selectedProperty.property_id); }} className="flex-1 btn-gradient">
                  Book Now
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">
              Please sign in or create an account to book this property.
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/auth?tab=signin" className="w-full">
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Link to="/auth?tab=signup" className="w-full">
                <Button className="w-full">Create Account</Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="text-muted-foreground">
            Join our platform today and experience seamless property management
          </p>
          <Link to="/auth?tab=signup">
            <Button size="lg" className="gap-2">
              Create Account <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
