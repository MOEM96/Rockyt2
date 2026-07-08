import React from 'react';
import Hero from './Hero';
import BentoGrid from './BentoGrid';
import FAQ from './FAQ';
import { DemoBookingProps } from '../types/index';

const HomePage: React.FC<DemoBookingProps> = ({ onBookDemo, onGetStarted }) => {
  return (
    <div className="max-w-[1200px] mr-auto ml-auto">
      <Hero onBookDemo={onBookDemo} onGetStarted={onGetStarted} />
      <BentoGrid onBookDemo={onBookDemo} onGetStarted={onGetStarted} />
      <FAQ />
    </div>
  );
};

export default HomePage;