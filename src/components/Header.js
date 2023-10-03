// Header.js

import React from 'react';
import Logo from '@/components/Logo';
import Link from 'next/link';


const Header = () => (
  <header className="p-4 text-center flex flex-col items-center">
    <Logo />
    <ul className="flex space-x-4 mt-4">
      <li><Link href="/" legacyBehavior><a className="hover:text-yellow-300">Home</a></Link></li>
      <li><Link href="/contact" legacyBehavior><a className="hover:text-yellow-300">Contact</a></Link></li>
      <li><Link href="/services" legacyBehavior><a className="hover:text-yellow-300">Services</a></Link></li>
      <li><Link href="/portfolio" legacyBehavior><a className="hover:text-yellow-300">Portfolio</a></Link></li>
      <li><Link href="/about" legacyBehavior><a className="hover:text-yellow-300">About</a></Link></li>
    </ul>
    
  </header>
);

export default Header;
