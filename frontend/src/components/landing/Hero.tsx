import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Hero() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-white dark:bg-black">
      <div className="text-center space-y-8 px-4">
        <div className="space-y-4">
          <h1 className="text-6xl md:text-7xl font-light text-black dark:text-white">
            ChatApp
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 font-light max-w-md mx-auto">
            Real-time messaging made simple
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/auth/register">
            <Button 
              size="lg" 
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-white hover:dark:bg-black hover:text-black hover:dark:text-white border-2 border-black dark:border-white transition-colors px-8 py-3 text-base font-normal"
            >
              Get Started
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button 
              variant="outline" 
              size="lg"
              className="bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:dark:bg-white hover:text-white hover:dark:text-black border-2 border-black dark:border-white transition-colors px-8 py-3 text-base font-normal"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
