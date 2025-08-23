import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { RotatingWords } from "./RotatingWords";
import { Loader2 } from "lucide-react";
import { usePostHog } from 'posthog-js/react';
import { SignInButton } from '@clerk/clerk-react';

export function LandingPage() {
  // State for waitlist
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<string>("waitlist");
  
  const posthog = usePostHog();
  
  // This is the list of rotating words that can be edited - same as Index page
  const actionWords = ["explore?", "work through?", "discover?", "chat about?", "discuss?", "problem solve?", "brainstorm?"];
  
  // Handle waitlist registration - simplified for now
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // For now, we'll just track the signup
      // In production, you would integrate with Clerk's waitlist API
      console.log('Waitlist signup:', email);
      
      // Track waitlist signup
      posthog.capture('waitlist_signup', { 
        email: email
      });

      setIsSubmitted(true);
      setEmail("");
    } catch (error: any) {
      console.error("Waitlist signup error:", error);
      alert("Failed to join waitlist. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background overflow-auto relative">
      {/* Background image layer with opacity */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/images/forest_v2.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.5
        }}
      />
      
      {/* Logo at the very top */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
        <img 
          src="/images/onboardinglogo_4.png" 
          alt="Logo" 
          className="h-24 w-auto"
          loading="eager"
          fetchPriority="high"
        />
      </div>
      
      {/* Content layer with full opacity */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-4">
        {/* Header with rotating words - aligned with form box */}
        <div className="max-w-md w-full mx-auto mb-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-lato font-bold tracking-tight leading-tight">
            <span className="gradient-text">What can we </span>
            <span className="text-primary">
              <RotatingWords 
                words={actionWords} 
                className="leading-none"
                emphasizedWord="brainstorm"
                emphasisFactor={2}
              />
            </span>
          </h1>
        </div>
        
        <div className="max-w-md w-full mx-auto">
          <div className="w-full p-8 space-y-4 bg-white rounded-lg shadow-lg border border-gray-100">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="waitlist">Join Waitlist</TabsTrigger>
                <TabsTrigger value="early-access">Early Access</TabsTrigger>
              </TabsList>
              
              <TabsContent value="waitlist" className="space-y-4">
                {isSubmitted ? (
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">
                      Successfully joined the waitlist!
                    </p>
                    <Button 
                      onClick={() => setIsSubmitted(false)}
                      variant="outline" 
                      className="w-full"
                    >
                      Add another email to waitlist
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <h2 className="text-2xl font-bold text-center">Join the Waitlist</h2>
                      <p className="text-center text-muted-foreground">
                        Sign up to get notified when we launch.
                      </p>
                    </div>
                    
                    <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Input
                          type="email"
                          placeholder="Email address *"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoFocus={activeTab === "waitlist"}
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Join Waitlist"
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="early-access" className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-center">Early Access</h2>
                  <p className="text-center text-muted-foreground">
                    Have early access? Sign in to get started.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <SignInButton mode="modal" forceRedirectUrl="/app/new">
                    <Button className="w-full">
                      Sign In with Early Access
                    </Button>
                  </SignInButton>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Don't have early access yet? Join the waitlist to get notified when we launch.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
    </div>
  );
}