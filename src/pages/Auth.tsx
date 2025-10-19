import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAdminExists } from "@/hooks/use-admin-exists";
import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [params] = useSearchParams();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<"Tenant" | "Owner" | "Admin">("Tenant");
  const adminExists = useAdminExists();
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Sync active tab with query param (?tab=signup|signin)
  useEffect(() => {
    const tab = params.get("tab");
    if (tab === "signup" || tab === "signin") {
      setActiveTab(tab);
    }
  }, [params]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Login failed. Please try again.");
      }

      // Get user profile from database
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", authData.user.id)
        .single() as any;

      if (userError || !userData) {
        console.error("User profile error:", userError);
        throw new Error("Failed to load user profile. Please contact support.");
      }

      // Check if account is approved (except for Admin)
      // Removed approval check for Owner accounts. Owners can log in immediately.

      // Show success message
      toast({
        title: "Login Successful! 🎉",
        description: `Welcome back, ${userData.first_name} ${userData.last_name}!`,
      });

      // Navigate based on role
      switch (userData.role) {
        case "Admin":
          navigate("/admin");
          break;
        case "Owner":
          navigate("/owner");
          break;
        case "Tenant":
          navigate("/tenant");
          break;
        default:
          navigate("/");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Provide helpful error messages
      let errorMessage = "Invalid email or password. Please try again.";
      
      if (error.message?.includes("invalid_credentials") || error.message?.includes("Invalid login")) {
        errorMessage = "Invalid email or password. If you haven't registered yet, please sign up first!";
      } else if (error.message?.includes("User not found")) {
        errorMessage = "No account found with this email. Please sign up first!";
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide your first and last name.",
        variant: "destructive",
      });
      return;
    }

    if (registerPassword.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create auth user (without email confirmation)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Registration failed");

      // Create user profile in database
      // Try different column names based on what your schema might have
      const profileData: any = {
        email: registerEmail,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber || null,
        role: role,
        is_approved: role === "Tenant", // Auto-approve tenants
      };

      // Try to add auth user ID with different possible column names
      // Your schema might use one of these:
      profileData.auth_user_id = authData.user.id;  // Most common
      // profileData.user_id = authData.user.id;       // Alternative
      // profileData.auth_user_id = authData.user.id;       // Alternative
      // profileData.id = authData.user.i//d;            // Alternative

      const { error: profileError } = await supabase
        .from("users")
        .insert([profileData] as any);

      if (profileError) {
        console.error("Profile creation failed:", profileError);
        
        // Check if it's a schema mismatch error
        if (profileError.message?.includes("auth_user_id") || 
            profileError.message?.includes("schema cache") ||
            profileError.code === 'PGRST204') {
          throw new Error(
            "Database schema mismatch detected. Please check DATABASE_SCHEMA_FIX.md for instructions."
          );
        }
        
        throw new Error("Failed to create user profile. Please try again.");
      }

      toast({
        title: "Registration Successful! 🎉",
        description: role === "Tenant" 
          ? "You can now log in with your credentials!"
          : "Your account is pending admin approval. You'll be notified once approved.",
      });

      // Clear form and switch to login tab
      setLoginEmail(registerEmail);
      setRegisterEmail("");
      setRegisterPassword("");
      setFirstName("");
      setLastName("");
      setPhoneNumber("");
      setRole("Tenant");
      
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
            <Building2 className="w-8 h-8" />
            RentalHub
          </Link>
          <p className="text-muted-foreground">Welcome back! Please sign in to continue</p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>Sign in or create a new account</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-4 p-3 bg-muted rounded-md">
                    💡 Don't have an account? Switch to the <strong>Sign Up</strong> tab first!
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
      
              <TabsContent value="signup">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name</Label>
                      <Input
                        id="first-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input
                        id="last-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-role">I am a</Label>
                    <Select value={role} onValueChange={(value: any) => setRole(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tenant">Tenant</SelectItem>
                        <SelectItem value="Owner">Property Owner</SelectItem>
                        {!adminExists && <SelectItem value="Admin">Admin</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading || (role === "Admin" && adminExists)}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                  {adminExists && (
                    <div className="text-xs text-red-500 mt-2">An admin account already exists. Only one admin is allowed.</div>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Auth;
