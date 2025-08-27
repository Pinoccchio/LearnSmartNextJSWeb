"use client"

import { Button } from "@/components/ui/button"
import { FOOTER_LINKS } from "@/lib/constants"
import { ArrowRight, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function CTAAndFooter() {
  return (
    <>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="container mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <Image
                  src="/images/logo/logo.png"
                  alt="LearnSmart Logo"
                  width={150}
                  height={60}
                  className="h-10 w-auto"
                />
                <div className="text-xl font-bold text-white">
                  LearnSmart
                </div>
              </div>
              
              <p className="text-gray-400 mb-6 leading-relaxed">
                Empowering criminology students with AI-powered study techniques. 
                Join the future of legal education and achieve your academic goals.
              </p>
              
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-full flex items-center justify-center cursor-pointer transition-colors">
                  <Facebook className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-full flex items-center justify-center cursor-pointer transition-colors">
                  <Twitter className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-full flex items-center justify-center cursor-pointer transition-colors">
                  <Instagram className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-full flex items-center justify-center cursor-pointer transition-colors">
                  <Linkedin className="w-5 h-5" />
                </div>
              </div>
            </div>
            
            {/* Product Links */}
            <div>
              <h3 className="text-white font-semibold mb-6">Product</h3>
              <ul className="space-y-3">
                {FOOTER_LINKS.product.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Company Links */}
            <div>
              <h3 className="text-white font-semibold mb-6">Company</h3>
              <ul className="space-y-3">
                {FOOTER_LINKS.company.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Contact Info */}
            <div>
              <h3 className="text-white font-semibold mb-6">Contact</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">Email</p>
                    <p className="text-gray-400 text-sm">support@learnsmart.edu</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">Phone</p>
                    <p className="text-gray-400 text-sm">+63 (02) 123-4567</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">Address</p>
                    <p className="text-gray-400 text-sm">Manila, Philippines</p>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-gray-400 text-sm">
                © 2024 LearnSmart. All rights reserved. Empowering criminology education.
              </div>
              
              <div className="flex gap-6">
                {FOOTER_LINKS.legal.map((link) => (
                  <Link 
                    key={link.name}
                    href={link.href}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}