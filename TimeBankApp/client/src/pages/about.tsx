import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  ArrowRight,
  HeartHandshake,
  Leaf,
  BookOpen,
  PenTool,
  ShieldCheck,
  Star,
} from "lucide-react";
import heroImage from "@/assets/images/tools.png"; //  Placeholder image for hero section
import gardeningImage from "@/assets/images/gardening.png";
import teachingImage from "@/assets/images/tutoring.png";

export default function About() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <Badge
                className="mb-6 bg-primary/10 text-primary hover:bg-primary/20 border-none px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                data-testid="badge-hero-status"
              >
                <HeartHandshake className="w-4 h-4 mr-2 inline-block" />
                Join 1,200+ neighbors trading time
              </Badge>
              <h1
                className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1] mb-6 text-foreground"
                data-testid="text-hero-title"
              >
                Your time is{" "}
                <span className="text-primary relative whitespace-nowrap">
                  valuable.
                  <svg
                    className="absolute w-full h-3 -bottom-1 left-0 text-accent/30"
                    viewBox="0 0 100 10"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0 5 Q 50 10 100 5"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                  </svg>
                </span>
                <br />
                Trade it fairly.
              </h1>
              <p
                className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-lg"
                data-testid="text-hero-subtitle"
              >
                Join our community time bank where everyone's hour is equal.
                Offer what you love doing, get help with what you need. No money
                exchanged, just time.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {!user && (
                  <>
                    <Link href="/login">
                     <Button
                        size="lg"
                        className="rounded-full text-base h-14 px-8 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100"
                        data-testid="button-hero-primary"
                      >
                        Login
                      </Button>
                    </Link>

                    <Link href="/signup">
                      <Button
                        size="lg"
                        variant="outline"
                        className="rounded-full text-base h-14 px-8 border-border bg-white hover:bg-secondary/50 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200"
                        data-testid="button-hero-secondary"
                      >
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              <div className="mt-10 flex items-center gap-4 text-sm text-muted-foreground font-medium">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center overflow-hidden"
                    >
                      <img
                        src={`https://i.pravatar.cc/100?img=${i + 10}`}
                        alt="User avatar"
                      />
                    </div>
                  ))}
                </div>
                <p>Over 5,000 hours exchanged this month</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-[2.5rem] blur-3xl transform rotate-3 scale-105 opacity-50"></div>
              <div className="relative rounded-[2.5rem] overflow-hidden border border-white/50 shadow-2xl">
                <img
                  src={heroImage}
                  alt="Community members interacting"
                  className="w-full h-[500px] object-cover"
                  data-testid="img-hero"
                />

                {/* Floating Card */}
                <Card className="absolute bottom-6 left-6 right-6 glass-card border-none bg-white/80 dark:bg-black/50 backdrop-blur-xl rounded-2xl">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Sarah earned 2 hours
                      </p>
                      <p className="text-xs text-muted-foreground">
                        for Web Design mentoring
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-secondary/30 relative">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2
              className="text-3xl md:text-4xl font-display font-bold mb-4"
              data-testid="text-hiw-title"
            >
              How TimeBanking Works
            </h2>
            <p
              className="text-muted-foreground text-lg"
              data-testid="text-hiw-subtitle"
            >
              A simple, fair exchange system built on trust and community.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-card border-none shadow-sm hover:shadow-md transition-shadow rounded-3xl relative overflow-hidden group">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-display font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Earn Time Credits</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Offer your skills, hobbies, or simply your time to help a
                  neighbor. Earn 1 Time Credit for every hour you give.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-none shadow-sm hover:shadow-md transition-shadow rounded-3xl relative overflow-hidden group">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-accent/10 text-accent-foreground rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-display font-bold text-accent">
                    2
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-3">Bank Your Hours</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Your earned hours are securely stored in your personal
                  TimeBank account, ready to be used whenever you need them.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-none shadow-sm hover:shadow-md transition-shadow rounded-3xl relative overflow-hidden group">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-display font-bold">3</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Spend Your Time</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Use your credits to request help from others in the community.
                  Gardening, tutoring, moving—the possibilities are endless.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2
                className="text-3xl md:text-4xl font-display font-bold mb-4"
                data-testid="text-services-title"
              >
                Featured Exchanges
              </h2>
              <p className="text-muted-foreground text-lg">
                What people are sharing right now
              </p>
            </div>
            <Button
              variant="ghost"
              className="hidden md:flex group text-primary hover:text-primary/80 font-medium"
              data-testid="button-view-all"
            >
              View all services
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Service Card 1 */}
            <Card
              className="overflow-hidden rounded-3xl border border-border/50 shadow-sm hover:shadow-lg transition-all group cursor-pointer"
              data-testid="card-service-1"
            >
              <div className="h-48 overflow-hidden relative">
                <Badge className="absolute top-4 left-4 z-10 bg-white/90 text-foreground hover:bg-white border-none shadow-sm rounded-full backdrop-blur-sm px-3 py-1">
                  <Leaf className="w-3.5 h-3.5 mr-1 text-primary" /> Home &
                  Garden
                </Badge>
                <div className="absolute top-4 right-4 z-10 bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-sm flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> 2 hrs
                </div>
                <img
                  src={gardeningImage}
                  alt="Gardening"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <CardContent className="p-6 bg-card relative">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src="https://i.pravatar.cc/150?img=32"
                    alt="David"
                    className="w-10 h-10 rounded-full border-2 border-background shadow-sm"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      David M.
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Star className="w-3 h-3 text-accent fill-accent mr-1" />{" "}
                      4.9 (12 exchanges)
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  Spring Garden Prep & Planting
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                  I can help you prepare your garden beds for spring planting. I
                  have my own tools and organic compost to share.
                </p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                  <span className="text-xs font-medium bg-secondary/50 px-2 py-1 rounded-md text-foreground">
                    Offering
                  </span>
                  <Button
                    size="sm"
                    className="rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                  >
                    Request
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Service Card 2 */}
            <Card
              className="overflow-hidden rounded-3xl border border-border/50 shadow-sm hover:shadow-lg transition-all group cursor-pointer"
              data-testid="card-service-2"
            >
              <div className="h-48 overflow-hidden relative bg-blue-50">
                <Badge className="absolute top-4 left-4 z-10 bg-white/90 text-foreground hover:bg-white border-none shadow-sm rounded-full backdrop-blur-sm px-3 py-1">
                  <BookOpen className="w-3.5 h-3.5 mr-1 text-blue-500" />{" "}
                  Education
                </Badge>
                <div className="absolute top-4 right-4 z-10 bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-sm flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> 1 hr
                </div>
                <img
                  src={teachingImage}
                  alt="Tutoring"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <CardContent className="p-6 bg-card relative">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src="https://i.pravatar.cc/150?img=44"
                    alt="Elena"
                    className="w-10 h-10 rounded-full border-2 border-background shadow-sm"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Elena R.
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Star className="w-3 h-3 text-accent fill-accent mr-1" />{" "}
                      5.0 (28 exchanges)
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  High School Math Tutoring
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                  Former teacher offering algebra and geometry tutoring. Happy
                  to meet at the local library or via video call.
                </p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                  <span className="text-xs font-medium bg-secondary/50 px-2 py-1 rounded-md text-foreground">
                    Offering
                  </span>
                  <Button
                    size="sm"
                    className="rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                  >
                    Request
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Service Card 3 - Need */}
            <Card
              className="overflow-hidden rounded-3xl border border-accent/20 shadow-sm hover:shadow-lg transition-all group cursor-pointer bg-accent/5"
              data-testid="card-service-3"
            >
              <div className="h-32 overflow-hidden relative bg-accent/10 flex items-center justify-center border-b border-accent/10">
                <Badge
                  variant="outline"
                  className="absolute top-4 left-4 z-10 bg-white/90 text-accent-foreground border-accent shadow-sm rounded-full backdrop-blur-sm px-3 py-1 font-bold"
                >
                  REQUEST
                </Badge>
                <div className="absolute top-4 right-4 z-10 bg-accent/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-sm flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> 3 hrs
                </div>
                <PenTool className="w-12 h-12 text-accent/40" />
              </div>
              <CardContent className="p-6 relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full border-2 border-background shadow-sm bg-muted flex items-center justify-center text-muted-foreground font-bold">
                    MK
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Marcus K.
                    </p>
                    <p className="text-xs text-muted-foreground">New Member</p>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">
                  Help painting living room
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                  Just moved in and need an extra set of hands to paint my
                  living room. I have all supplies and will provide pizza!
                </p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-accent/10">
                  <span className="text-xs font-medium bg-white px-2 py-1 rounded-md text-accent-foreground border border-accent/20">
                    Needs Help
                  </span>
                  <Button
                    size="sm"
                    className="rounded-full bg-accent text-white hover:bg-accent/90 shadow-md shadow-accent/20 transition-colors"
                  >
                    Offer Help
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center md:hidden">
            <Button
              variant="outline"
              className="w-full rounded-full"
              data-testid="button-view-all-mobile"
            >
              View all services
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-white border-y border-border/50">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
            Safe & Trusted Community
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            All members are verified through community references. Our review
            system ensures high quality exchanges and mutual respect.
          </p>
        </div>
      </section>
    </div>
  );
}