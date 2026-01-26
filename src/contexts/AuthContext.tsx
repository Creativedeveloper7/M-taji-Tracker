import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  UserProfile,
  CompleteUserProfile,
  AuthContextType,
  UserType,
} from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [completeProfile, setCompleteProfile] = useState<CompleteUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch complete user profile with all related data
  const fetchCompleteProfile = async (userId: string) => {
    try {
      // Fetch user profile - use maybeSingle to avoid errors if not found
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        // Log error but don't throw - profile might not exist yet
        console.warn('Error fetching profile:', profileError);
      }

      if (!profile) {
        console.warn('User profile not found for user:', userId);
        return null;
      }

      setUserProfile(profile);

      // Fetch type-specific data based on user_type
      let typeSpecificData: any = {};

      if (profile.user_type === 'organization') {
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('user_profile_id', profile.id)
          .maybeSingle();
        typeSpecificData.organization = org;
      } else if (profile.user_type === 'government') {
        const { data: gov } = await supabase
          .from('government_entities')
          .select('*')
          .eq('user_profile_id', profile.id)
          .maybeSingle();
        typeSpecificData.government_entity = gov;
      } else if (profile.user_type === 'political_figure') {
        const { data: political } = await supabase
          .from('political_figures')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        typeSpecificData.political_figure = political;
      }

      // Also fetch changemaker data as a fallback for name
      const { data: changemaker } = await supabase
        .from('changemakers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      typeSpecificData.changemaker = changemaker;

      // Fetch onboarding progress
      const { data: onboarding } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_profile_id', profile.id)
        .single();

      // Fetch verification documents
      const { data: documents } = await supabase
        .from('verification_documents')
        .select('*')
        .eq('user_profile_id', profile.id)
        .order('uploaded_at', { ascending: false });

      // Fetch KYC checks
      const { data: kyc_checks } = await supabase
        .from('kyc_checks')
        .select('*')
        .eq('user_profile_id', profile.id)
        .order('initiated_at', { ascending: false });

      const complete: CompleteUserProfile = {
        profile,
        ...typeSpecificData,
        onboarding: onboarding || {
          id: '',
          user_profile_id: profile.id,
          current_step: 1,
          total_steps: 5,
          steps_completed: {
            account_creation: true,
            profile_information: false,
            document_upload: false,
            verification: false,
            approval: false,
          },
          is_completed: false,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        documents: documents || [],
        kyc_checks: kyc_checks || [],
      };

      setCompleteProfile(complete);
      return complete;
    } catch (error) {
      console.error('Error fetching complete profile:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          await fetchCompleteProfile(session.user.id);
          
          // Update last login
          await supabase
            .from('user_profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('user_id', session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session?.user) {
          setUser(session.user);
          await fetchCompleteProfile(session.user.id);
        } else {
          setUser(null);
          setUserProfile(null);
          setCompleteProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  // Sign up - creates auth user only, profile creation happens in registration flow
  const signUp = async (email: string, password: string, userType: UserType) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: userType,
        },
      },
    });

    if (error) throw error;

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: data.user.id,
          email: email,
          user_type: userType,
          verification_status: 'pending',
          kyc_status: 'not_started',
        });

      if (profileError) throw profileError;
    }
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    setUser(null);
    setUserProfile(null);
    setCompleteProfile(null);
  };

  // Update profile
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!userProfile) throw new Error('No user profile found');

    const { error } = await supabase
      .from('user_profiles')
      .update(data)
      .eq('id', userProfile.id);

    if (error) throw error;

    // Refresh profile
    if (user) {
      await fetchCompleteProfile(user.id);
    }
  };

  // Refresh profile
  const refreshProfile = async () => {
    if (user) {
      await fetchCompleteProfile(user.id);
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    completeProfile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
