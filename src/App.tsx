/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Hero } from './components/Hero';
import { Theory } from './components/Theory';
import { Preprocessing } from './components/Preprocessing';
import { Playground } from './components/Playground';
import { HierarchicalClustering } from './components/HierarchicalClustering';
import { CustomerSegmentation } from './components/CustomerSegmentation';
import { BusinessApplications } from './components/BusinessApplications';
import { Activities } from './components/Activities';
import { NotebooksSection } from './components/NotebooksSection';
import { References } from './components/References';
import { Footer } from './components/Footer';
import { TranslationWidget } from './components/TranslationWidget';
import { LanguageProvider } from './context/LanguageContext';

export default function App() {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
        <TranslationWidget />
        <Hero />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-32">
          <Theory />
          <Playground />
          <HierarchicalClustering />
          <Preprocessing />
          <CustomerSegmentation />
          <BusinessApplications />
          <Activities />
          <NotebooksSection />
          <References />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}

