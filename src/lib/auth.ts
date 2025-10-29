import { supabase } from "@/integrations/supabase/client";

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: "Tenant" | "Owner" | "Admin";
}

export interface SignInData {
  email: string;
  password: string;
}

export interface UserProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  role: "Tenant" | "Owner" | "Admin";
  is_approved: boolean;
  auth_user_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters long" };
  }
  if (password.length < 8) {
    return { valid: true, message: "Password is acceptable but could be stronger" };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  if (strength >= 3) {
    return { valid: true, message: "Strong password" };
  } else if (strength >= 2) {
    return { valid: true, message: "Moderate password" };
  } else {
    return { valid: true, message: "Weak password - consider adding numbers and special characters" };
  }
};

/**
 * Sign up a new user
 */
export const signUp = async (data: SignUpData): Promise<{ success: boolean; message: string; userId?: string }> => {
  try {
    // Validate inputs
    if (!data.firstName.trim() || !data.lastName.trim()) {
      return { success: false, message: "First name and last name are required" };
    }

    const passwordCheck = validatePassword(data.password);
    if (!passwordCheck.valid) {
      return { success: false, message: passwordCheck.message };
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          role: data.role,
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("User creation failed");

    // Create user profile in database
    const { error: profileError } = await supabase
      .from("users")
      .insert({
        auth_user_id: authData.user.id,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: data.phoneNumber || null,
        role: data.role,
        is_approved: data.role === "Tenant", // Auto-approve tenants
      } as any);

    if (profileError) {
      console.error("Profile creation error:", profileError);
      throw new Error("Failed to create user profile");
    }

    return {
      success: true,
      message: data.role === "Tenant" 
        ? "Registration successful! You can now log in."
        : "Registration successful! Your account is pending admin approval.",
      userId: authData.user.id
    };
  } catch (error: any) {
    console.error("Sign up error:", error);
    return {
      success: false,
      message: error.message || "Registration failed. Please try again."
    };
  }
};

/**
 * Sign in an existing user
 */
export const signIn = async (data: SignInData): Promise<{ success: boolean; message: string; profile?: UserProfile }> => {
  try {
    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Authentication failed");

    // Get user profile
    const { data: profile, error: profileError } = await (supabase as any)
      .from("users")
      .select("*")
      .eq("auth_user_id", authData.user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile fetch error:", profileError);
      throw new Error("Failed to fetch user profile");
    }

    // Check if account is approved
    if (!profile.is_approved && profile.role !== "Admin") {
      await supabase.auth.signOut();
      return {
        success: false,
        message: "Your account is pending admin approval. Please wait for approval before logging in."
      };
    }

    return {
      success: true,
      message: `Welcome back, ${profile.first_name}!`,
      profile: profile as UserProfile
    };
  } catch (error: any) {
    console.error("Sign in error:", error);
    return {
      success: false,
      message: error.message || "Login failed. Please check your credentials."
    };
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    return {
      success: true,
      message: "Signed out successfully"
    };
  } catch (error: any) {
    console.error("Sign out error:", error);
    return {
      success: false,
      message: "Failed to sign out"
    };
  }
};

/**
 * Get current user session
 */
export const getCurrentUser = async (): Promise<UserProfile | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) return null;

    const { data: profile, error } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", session.user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return profile as UserProfile;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
};

/**
 * Reset password
 */
export const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;

    return {
      success: true,
      message: "Password reset email sent. Please check your inbox."
    };
  } catch (error: any) {
    console.error("Password reset error:", error);
    return {
      success: false,
      message: error.message || "Failed to send password reset email"
    };
  }
};

/**
 * Update password
 */
export const updatePassword = async (newPassword: string): Promise<{ success: boolean; message: string }> => {
  try {
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      return { success: false, message: passwordCheck.message };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    return {
      success: true,
      message: "Password updated successfully"
    };
  } catch (error: any) {
    console.error("Password update error:", error);
    return {
      success: false,
      message: error.message || "Failed to update password"
    };
  }
};
