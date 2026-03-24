import { Lightbulb, Rocket, Handshake, Gem, Users, ShieldCheck, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="bg-background min-h-[calc(100vh-var(--header-height)-var(--footer-height))]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-700 to-blue-900 text-white py-20 md:py-28 text-center overflow-hidden">
        <div className="absolute inset-0 bg-black/20 z-0"></div> {/* Subtle overlay */}
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-md">
            Empowering Your Digital Journey
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto opacity-90">
            At Dropskey, we believe in providing seamless access to the digital tools that drive innovation and success.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="container mx-auto px-4 py-16 md:py-20 bg-background">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Our Story</h2>
          <p className="text-lg text-muted-foreground">
            Born from a passion for technology and a commitment to accessibility, Dropskey was founded to simplify the acquisition of essential digital keys and software licenses. We understand the challenges businesses and individuals face in navigating complex software markets, and we're here to offer a clear, reliable path.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center space-x-4">
              <Lightbulb className="h-8 w-8 text-blue-600" />
              <CardTitle>Our Vision</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                To be the leading global provider of digital keys, recognized for our unparalleled selection, instant delivery, and unwavering commitment to customer satisfaction. We envision a world where digital tools are easily accessible to everyone.
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center space-x-4">
              <Rocket className="h-8 w-8 text-blue-600" />
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Our mission is to empower individuals and businesses by providing a secure, efficient, and user-friendly platform for purchasing authentic digital software licenses and keys, ensuring they have the tools they need to thrive.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="bg-card py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Core Values</h2>
            <p className="text-lg text-muted-foreground">
              These principles guide every decision we make and every interaction we have.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <Handshake className="h-10 w-10 text-green-600 mx-auto mb-4" />
                <CardTitle>Trust & Transparency</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We build lasting relationships through honesty, clear communication, and reliable service.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <Gem className="h-10 w-10 text-purple-600 mx-auto mb-4" />
                <CardTitle>Quality & Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We are committed to offering only the highest quality products and services.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <Users className="h-10 w-10 text-orange-600 mx-auto mb-4" />
                <CardTitle>Customer Focus</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your needs are at the heart of everything we do. We strive to exceed expectations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us - Reiteration of key benefits */}
      <section className="container mx-auto px-4 py-16 md:py-20 bg-background">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Why Dropskey?</h2>
          <p className="text-lg text-muted-foreground">
            Experience the difference with a partner dedicated to your digital success.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="text-center shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <ShieldCheck className="h-10 w-10 text-blue-600 mx-auto mb-4" />
              <CardTitle>Guaranteed Authenticity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                All our digital keys and software licenses are 100% genuine and verified.
              </p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <Zap className="h-10 w-10 text-blue-600 mx-auto mb-4" />
              <CardTitle>Instant Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Receive your digital products immediately after purchase, no waiting.
              </p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <Users className="h-10 w-10 text-blue-600 mx-auto mb-4" />
              <CardTitle>Dedicated Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Our expert team is available to assist you with any questions or issues.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-[#ff7300] text-white py-16 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Explore?</h2>
          <p className="text-lg text-orange-100 mb-8">
            Browse our extensive catalog of digital solutions and find what you need today.
          </p>
          <Button asChild size="lg" className="bg-white text-[#ff7300] hover:bg-gray-100">
            <Link href="/shop">Shop Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}