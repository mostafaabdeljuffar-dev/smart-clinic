import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-dvh w-full flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative Nebula Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="relative z-10 w-full max-w-lg text-center space-y-8"
      >
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold font-heading text-foreground">
            404
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            Lost in Space
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            The page you're looking for has drifted away into the void. Let's get you back to safety.
          </p>
        </div>

        <div className="pt-4">
          <Link href="/">
            <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 px-8 cursor-pointer">
              <Home className="mr-2 h-5 w-5" />
              Return Home
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
