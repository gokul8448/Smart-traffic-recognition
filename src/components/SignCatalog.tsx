import React, { useState } from 'react';
import { TrafficSignIcon } from './TrafficSignIcon';
import { SignType } from '../types';
import { BookOpen, Check, Play, Shield, Layers, HelpCircle } from 'lucide-react';

interface CatalogItem {
  type: SignType;
  value?: number;
  name: string;
  category: 'Regulatory' | 'Warning' | 'Work Zone' | 'Guide';
  meaning: string;
  systemAction: string;
  modelAccuracy: string;
  latencyMs: number;
}

const CATALOG_SIGNS: CatalogItem[] = [
  {
    type: 'SPEED_LIMIT',
    value: 25,
    name: 'Speed Limit 25 MPH',
    category: 'Regulatory',
    meaning: 'Residential or business district maximum allowable velocity.',
    systemAction: 'Audits current speed, triggers audible violation if speed > 25.',
    modelAccuracy: '99.8%',
    latencyMs: 12
  },
  {
    type: 'SPEED_LIMIT',
    value: 45,
    name: 'Speed Limit 45 MPH',
    category: 'Regulatory',
    meaning: 'Arterial boulevard statutory limit.',
    systemAction: 'Adjusts cruise control buffer, sets speed ceiling.',
    modelAccuracy: '99.6%',
    latencyMs: 11
  },
  {
    type: 'SPEED_LIMIT',
    value: 65,
    name: 'Speed Limit 65 MPH',
    category: 'Regulatory',
    meaning: 'Multi-lane freeway highway maximum speed limit.',
    systemAction: 'Enables high-speed radar corridor, checks tailgating distance.',
    modelAccuracy: '99.9%',
    latencyMs: 14
  },
  {
    type: 'STOP',
    name: 'Stop Sign (MUTCD R1-1)',
    category: 'Regulatory',
    meaning: 'Mandatory complete vehicle halt at the stop line before proceeding.',
    systemAction: 'Arms AEB (Autonomous Emergency Braking), monitors deceleration curve.',
    modelAccuracy: '99.9%',
    latencyMs: 9
  },
  {
    type: 'YIELD',
    name: 'Yield (MUTCD R1-2)',
    category: 'Regulatory',
    meaning: 'Driver must slow down and give way to oncoming traffic and pedestrians.',
    systemAction: 'Prompts foot-over-brake advisory, prepares cross-traffic sensor.',
    modelAccuracy: '99.4%',
    latencyMs: 13
  },
  {
    type: 'SCHOOL_ZONE',
    value: 20,
    name: 'School Zone & Crossing',
    category: 'Regulatory',
    meaning: 'Active school perimeter, heavy pedestrian and child presence.',
    systemAction: 'Strict 20 MPH cap, increases forward radar sensitivity by 200%.',
    modelAccuracy: '98.9%',
    latencyMs: 15
  },
  {
    type: 'PEDESTRIAN_CROSSING',
    name: 'Pedestrian Crosswalk',
    category: 'Warning',
    meaning: 'Marked roadway crossing ahead; pedestrians hold legal right-of-way.',
    systemAction: 'Scans curb lines for pedestrian silhouettes, primes brake booster.',
    modelAccuracy: '98.5%',
    latencyMs: 16
  },
  {
    type: 'CONSTRUCTION',
    name: 'Road Work Ahead',
    category: 'Work Zone',
    meaning: 'Highway construction zone with workers and machinery adjacent to road.',
    systemAction: 'Enforces work-zone double-fine penalty alert, narrows lane margins.',
    modelAccuracy: '98.8%',
    latencyMs: 14
  },
  {
    type: 'SLIPPERY_ROAD',
    name: 'Slippery When Wet',
    category: 'Warning',
    meaning: 'Road surface friction significantly reduced under precipitation or ice.',
    systemAction: 'Lengthens following distance target to 4 seconds, softens throttle.',
    modelAccuracy: '98.1%',
    latencyMs: 18
  },
  {
    type: 'SHARP_CURVE',
    name: 'Sharp Curve Advisory',
    category: 'Warning',
    meaning: 'Abrupt curvature requiring significant speed reduction for lateral grip.',
    systemAction: 'Advises deceleration prior to curve apex, checks steering torque.',
    modelAccuracy: '98.7%',
    latencyMs: 14
  }
];

interface SignCatalogProps {
  onInjectSign: (type: SignType, value?: number, name?: string) => void;
}

export const SignCatalog: React.FC<SignCatalogProps> = ({ onInjectSign }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [injectedId, setInjectedId] = useState<string | null>(null);

  const categories = ['ALL', 'Regulatory', 'Warning', 'Work Zone'];

  const filtered = CATALOG_SIGNS.filter((item) => {
    if (selectedCategory === 'ALL') return true;
    return item.category === selectedCategory;
  });

  const handleInject = (item: CatalogItem) => {
    onInjectSign(item.type, item.value, item.name);
    setInjectedId(item.name);
    setTimeout(() => setInjectedId(null), 2500);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white tracking-tight">
              Traffic Sign Recognition Catalog & Neural Benchmark
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Classified traffic sign taxonomy with real-time detection latencies & system responses
          </p>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Signs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 p-1 flex items-center justify-center">
                <TrafficSignIcon type={item.type} value={item.value} size="md" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold uppercase">
                    {item.category}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    {item.modelAccuracy} Acc
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mt-1 truncate">
                  {item.name}
                </h4>

                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {item.meaning}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                <span>Latency:</span>
                <span className="text-cyan-400 font-semibold">{item.latencyMs}ms</span>
              </div>

              <button
                onClick={() => handleInject(item)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  injectedId === item.name
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title="Test this sign in the active road simulator"
              >
                {injectedId === item.name ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Injected!
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-cyan-400" />
                    Test in Sim
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
