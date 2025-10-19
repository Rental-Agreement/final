import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Shield, ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
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

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-primary to-primary/90 border-none text-primary-foreground">
          <CardContent className="py-12">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">100%</div>
                <div className="text-primary-foreground/80">Secure Payments</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">24/7</div>
                <div className="text-primary-foreground/80">Support Available</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">Fast</div>
                <div className="text-primary-foreground/80">Payout Processing</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

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
