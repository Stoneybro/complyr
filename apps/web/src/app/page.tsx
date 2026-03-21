import Navigation from '../components/home/Navigation';
import Hero from '../components/home/Hero';
import Problem from '../components/home/Problem';
import Features from '../components/home/Features';
import HowItWorks from '../components/home/HowItWorks';
import UseCases from '../components/home/UseCases';
import Technology from '../components/home/Technology';
import FinalCTA from '../components/home/FinalCTA';
import Footer from '../components/home/Footer';

export default function App() {
  return (
    <div style={{ backgroundColor: '#fafaf8' }} className="min-h-screen">
      <Navigation />
      <Hero />
      <Problem />
      <Features />
      <HowItWorks />
      <UseCases />
      <Technology />
      <FinalCTA />
      <Footer />
    </div>
  );
}