'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-xl p-8 text-center"
      >
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">Page Not Found</h1>
        
        <p className="text-gray-400 mb-8">
          The requested URL was not found on the server. If you entered the URL manually, 
          please check your spelling and try again.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            asChild
            variant="outline" 
            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Link>
          </Button>
          
          <Button 
            onClick={() => window.history.back()}
            variant="outline" 
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </motion.div>
    </div>
  )
}