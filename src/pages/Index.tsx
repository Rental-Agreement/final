import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Shield, ArrowRight, Check, ChevronDown, X, Star, TrendingUp, Sparkles, MapPin, Clock, Award, Search as SearchIcon, Heart, CheckCircle2, Zap, Globe, Phone, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Link } from "react-router-dom";
import { useProperties } from "@/hooks/use-properties";
import { PropertyCard } from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageCarouselWithThumbnails } from "@/components/ImageCarouselWithThumbnails";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatINR } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Index = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  // Hero form local state (independent, applied on Search)
  const [heroSearch, setHeroSearch] = useState("");
  const [heroCity, setHeroCity] = useState("");
  const [type, setType] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [amenities, setAmenities] = useState<Array<"wifi"|"elevator"|"geyser"|"ac"|"parking">>([]);
  const [sort, setSort] = useState<"price_asc"|"price_desc"|"rating_desc"|"newest"|"distance_asc"|undefined>(undefined);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const featuredRef = useRef<HTMLDivElement | null>(null);

  const handleHeroSearch = () => {
    setSearch(heroSearch);
    setCity(heroCity);
    const el = document.getElementById("catalog");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  
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
  
  // Gentle auto-scroll for Featured Properties strip, pauses on user interaction
  useEffect(() => {
    const el = featuredRef.current;
    if (!el) return;
    let userInteracted = false;
    const markInteracted = () => { userInteracted = true; };
    el.addEventListener("wheel", markInteracted, { passive: true });
    el.addEventListener("touchstart", markInteracted, { passive: true });
    const id = window.setInterval(() => {
      if (!el || userInteracted) return;
      const atEnd = Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 300, behavior: "smooth" });
      }
    }, 4000);
    return () => {
      window.clearInterval(id);
      el.removeEventListener("wheel", markInteracted);
      el.removeEventListener("touchstart", markInteracted);
    };
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold gradient-text">Tenant Town</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#catalog" className="hover:text-primary transition-colors">Properties</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-primary transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/auth?tab=signin">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link to="/auth?tab=signup">
              <Button size="sm" className="gradient-bg">Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Enhanced */}
      <section className="relative container mx-auto px-4 pt-16 pb-20">
        <div className="text-center space-y-8 max-w-5xl mx-auto">
          {/* Badge with Animation */}
          <div className="inline-block animate-bounce-slow">
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 backdrop-blur">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-semibold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                #1 Rental Management Platform in India
              </span>
            </div>
          </div>
          
          {/* Main Heading with Gradient */}
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
            <span className="bg-gradient-to-r from-foreground via-primary to-purple-600 bg-clip-text text-transparent">
              Find Your Perfect
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-600 via-primary to-foreground bg-clip-text text-transparent">
              Home Today
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Discover verified properties, connect with trusted owners, and manage your rentals seamlessly. 
            Join <span className="font-bold text-primary">25,000+</span> happy tenants and owners.
          </p>
          
          {/* Enhanced Hero Search Bar */}
          <div className="relative bg-card/90 backdrop-blur-xl border-2 border-primary/20 rounded-2xl p-4 shadow-2xl max-w-4xl mx-auto hover:border-primary/40 transition-all">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  aria-label="Search destinations"
                  type="text" 
                  placeholder="Search destinations (e.g., Koramangala, Mumbai)" 
                  value={heroSearch} 
                  onChange={e => setHeroSearch(e.target.value)} 
                  className="h-14 pl-12 text-base border-0 bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <div className="relative md:w-48">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  aria-label="City"
                  type="text" 
                  placeholder="City"
                  value={heroCity} 
                  onChange={e => setHeroCity(e.target.value)} 
                  className="h-14 pl-12 text-base border-0 bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <Button 
                aria-label="Search properties" 
                size="lg" 
                className="h-14 px-8 gradient-bg text-base font-semibold shadow-lg hover:shadow-xl transition-all" 
                onClick={handleHeroSearch}
              >
                <SearchIcon className="w-5 h-5 mr-2" />
                Search Now
              </Button>
            </div>
            
            {/* Popular Searches */}
            <div className="flex flex-wrap gap-2 mt-4 text-sm">
              <span className="text-muted-foreground">Popular:</span>
              {["Mumbai", "Bangalore", "Delhi", "Pune"].map((city) => (
                <button
                  key={city}
                  onClick={() => { setHeroCity(city); handleHeroSearch(); }}
                  className="px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center pt-6">
            <Link to="/auth?tab=signup">
              <Button size="lg" className="gap-2 gradient-bg shadow-xl hover:shadow-2xl transition-all text-base px-8 h-12">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <a href="#catalog" aria-label="Browse properties">
              <Button variant="outline" size="lg" className="gap-2 text-base px-8 h-12 border-2">
                <Building2 className="w-5 h-5" />
                Browse 5000+ Properties
              </Button>
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>100% Verified Properties</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span>Instant Booking</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust / Stats Strip */}
      <section aria-label="Platform stats" className="container mx-auto px-4 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="py-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-primary mb-1">25k+</p>
              <p className="text-sm text-muted-foreground">Happy Tenants</p>
            </CardContent>
          </Card>
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="py-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-primary mb-1">5k+</p>
              <p className="text-sm text-muted-foreground">Verified Properties</p>
            </CardContent>
          </Card>
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="py-6 text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
              <p className="text-3xl font-bold text-primary mb-1">4.8/5</p>
              <p className="text-sm text-muted-foreground">Avg. Rating</p>
            </CardContent>
          </Card>
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="py-6 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-primary mb-1">98%</p>
              <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 rounded-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 gradient-text">Why Choose Us</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Experience the best in rental management with our comprehensive platform designed for tenants, owners, and admins</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Tenant Card */}
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-1 duration-300 bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">For Tenants</CardTitle>
              <CardDescription>Find and book your perfect space</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-sm">Browse available properties and rooms</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-sm">Secure online rent payments</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-sm">Manage lease agreements</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-sm">Raise disputes when needed</span>
              </div>
            </CardContent>
          </Card>

          {/* Owner Card */}
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-1 duration-300 bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">For Owners</CardTitle>
              <CardDescription>Manage your properties with ease</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-sm">List properties, rooms, and beds</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-sm">Approve tenant applications</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-sm">Receive automated payouts</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-sm">Track rental income</span>
              </div>
            </CardContent>
          </Card>

          {/* Admin Card */}
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-1 duration-300 bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-4 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">For Admins</CardTitle>
              <CardDescription>Complete platform oversight</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-sm">Approve properties and owners</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-sm">Monitor all transactions</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-sm">Resolve disputes</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-sm">Generate system reports</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 gradient-text">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Get started in three simple steps</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="relative text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <span className="text-3xl font-bold text-white">1</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Create Account</h3>
            <p className="text-muted-foreground">Sign up in seconds as a tenant, owner, or admin to access your personalized dashboard</p>
          </div>
          <div className="relative text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <span className="text-3xl font-bold text-white">2</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Browse & Select</h3>
            <p className="text-muted-foreground">Search through thousands of verified properties with advanced filters and instant booking</p>
          </div>
          <div className="relative text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <span className="text-3xl font-bold text-white">3</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Move In</h3>
            <p className="text-muted-foreground">Complete secure payments, sign digital leases, and move into your new home hassle-free</p>
          </div>
        </div>
      </section>


      {/* Public Property Catalog Section */}
      <section id="catalog" className="container mx-auto px-4 py-8 sm:py-16">
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
            <div ref={featuredRef} className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide scroll-smooth">
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

      {/* Testimonials */}
      <section id="reviews" className="container mx-auto px-4 py-20 bg-gradient-to-br from-purple-50/50 via-blue-50/50 to-pink-50/50 rounded-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 gradient-text">What Our Users Say</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Real stories from tenants, owners, and admins who trust our platform</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[{
            quote: "Booking was effortless and the property matched the photos perfectly.",
            name: "Aisha, Tenant"
          }, {
            quote: "I listed my property in minutes and found a tenant within a week.",
            name: "Rohit, Owner"
          }, {
            quote: "The admin tools give us full visibility and control.",
            name: "Meera, Admin"
          }].map((t, i) => (
            <Card key={i} className="border-2 h-full hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur">
              <CardContent className="pt-6 flex flex-col h-full">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="italic text-muted-foreground mb-6 flex-grow">"{t.quote} The entire process was smooth and professional!"</p>
                <div className="flex items-center gap-3 pt-4 border-t">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-2xl">
                    {i === 0 ? "👩" : i === 1 ? "👨" : "👩‍💼"}
                  </div>
                  <div>
                    <p className="font-semibold">{t.name.split(",")[0]}</p>
                    <p className="text-sm text-muted-foreground">{t.name.split(",")[1]?.trim() || "User"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 gradient-text">Frequently Asked Questions</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to know about our platform</p>
        </div>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="border rounded-lg px-6 bg-card">
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-semibold">How do I book a property?</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Simply browse available properties, click "Book Now" on your preferred option, sign in or create an account, and complete the secure payment process. You'll receive instant confirmation and lease documents.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border rounded-lg px-6 bg-card">
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-semibold">Are all properties verified?</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! Every property goes through a rigorous verification process by our admin team. We verify ownership documents, conduct property inspections, and ensure all amenities listed are accurate.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3" className="border rounded-lg px-6 bg-card">
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-semibold">What payment methods do you accept?</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We accept all major payment methods including credit/debit cards, UPI, net banking, and digital wallets. All payments are processed securely through encrypted payment gateways.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4" className="border rounded-lg px-6 bg-card">
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-semibold">How does the dispute resolution work?</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                If any issues arise, tenants can raise a dispute through their dashboard. Our admin team reviews both sides, mediates discussions, and works to reach a fair resolution within 48-72 hours.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5" className="border rounded-lg px-6 bg-card">
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-semibold">Can I cancel my booking?</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Cancellation policies vary by property. Properties marked with "Free Cancellation" can be cancelled up to 24 hours before move-in for a full refund. Check individual property details for specific policies.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary via-purple-600 to-blue-600 rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-white/90 mb-8 text-lg">
            Join thousands of happy users and experience seamless property management today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?tab=signup">
              <Button size="lg" variant="secondary" className="gap-2 text-lg px-8">
                Create Account <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="#catalog">
              <Button size="lg" variant="outline" className="gap-2 text-lg px-8 bg-white/10 border-white/30 text-white hover:bg-white/20">
                Browse Properties
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Tenant Town Central
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your trusted platform for finding the perfect rental property
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition">
                  <Globe className="w-4 h-4 text-primary" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition">
                  <Mail className="w-4 h-4 text-primary" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition">
                  <Phone className="w-4 h-4 text-primary" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Users</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#catalog" className="hover:text-primary transition">Browse Properties</a></li>
                <li><Link to="/auth?tab=signup" className="hover:text-primary transition">Sign Up</Link></li>
                <li><Link to="/auth?tab=signin" className="hover:text-primary transition">Sign In</Link></li>
                <li><a href="#how-it-works" className="hover:text-primary transition">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition">Features</a></li>
                <li><a href="#reviews" className="hover:text-primary transition">Testimonials</a></li>
                <li><a href="#faq" className="hover:text-primary transition">FAQ</a></li>
                <li><a href="#" className="hover:text-primary transition">Help Center</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-primary transition">Disclaimer</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t flex flex-col sm:flex-row gap-4 items-center justify-between">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Tenant Town Central. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition">Privacy</a>
              <a href="#" className="hover:text-primary transition">Terms</a>
              <a href="#" className="hover:text-primary transition">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
