"use client";

import React, { useState, useRef, useEffect } from 'react';
// Import shadcn/ui components (replace with your actual import paths)
import { Button } from './ui/button';
import { RuleCombobox } from './ui/RuleCombobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ChevronsUpDown, Sparkles, Loader2 } from 'lucide-react';
import { Textarea } from './ui/textarea';

// --- Type Definitions ---
// Merge DE and AT into a single column 'DE/AT'
const LOCALES = [
  { code: 'de_at', label: 'DE/AT' },
  { code: 'fr', label: 'FR' },
  { code: 'es', label: 'ES' },
] as const;

// Define the row type
interface CampaignTableProps {
  campaignName?: string;
}

interface CampaignRow {
  id: number;
  section: string;
  topic: string;
  ukText: string;
  // Only store de, fr, es translations (AT removed)
  translations: {
    de: string;
    fr: string;
    es: string;
  };
}

// List of channels (for selector)
const CHANNELS = [
  'Digital Display',
  'BFW Social',
  'DOOH & Print',
  'Countdown Timers',
];

// Campaign sections and topics
const SECTIONS = [
  {
    name: 'Lead-up',
    topics: [
      'Headline (wide)',
      'Headline (square)',
      'Headline (narrow)',
      'Subheader (% off — 1-line)',
      'Subheader (% off — 2-line)',
      'Date (1-line)',
      'Date (2-line)',
      'CTA',
      'Legal',
      'Box Logo',
    ],
  },
  {
    name: 'Live',
    topics: [
      'Headline (wide)',
      'Headline (square)',
      'Headline (narrow)',
      'Subheader (% off — 1-line)',
      'Subheader (% off — 2-line)',
      'Date (1-line)',
      'Date (2-line)',
      'CTA',
      'Legal',
      'Box Logo',
    ],
  },
  {
    name: 'Last Minute Deals',
    topics: [
      'Headline (wide)',
      'Headline (square)',
      'Headline (narrow)',
      'Subheader (% off — 1-line)',
      'Subheader (% off — 2-line)',
      'Date (1-line)',
      'Date (2-line)',
      'CTA',
      'Legal',
      'Box Logo',
    ],
  },
];

// Helper to generate initial campaign data
function generateInitialRows(): CampaignRow[] {
  let id = 1;
  const rows: CampaignRow[] = [];
  for (const section of SECTIONS) {
    for (const topic of section.topics) {
      // Pre-fill only the 'Lead-up' section with values from the image
      if (section.name === 'Lead-up') {
        let ukText = '', de = '', fr = '', es = '';
        switch (topic) {
          case 'Headline (wide)':
            ukText = 'Black Friday Week';
            de = 'Black Friday Woche';
            fr = 'Black Friday Week';
            es = 'Semana de Black Friday';
            break;
          case 'Headline (square)':
            ukText = 'Black Friday Week';
            de = 'Black Friday Woche';
            fr = 'Black Friday Week';
            es = 'Semana de Black Friday';
            break;
          case 'Headline (narrow)':
            ukText = 'Black Friday Week';
            de = 'Black Friday Woche';
            fr = 'Black\nFriday\nWeek';
            es = 'Semana\nde Black\nFriday';
            break;
          case 'Subheader (% off — 1-line)':
            ukText = 'Up to 40% off';
            de = 'Spare bis zu 40 %';
            fr = "Jusqu'à -35 %";
            es = 'Ahorra hasta un 45 %';
            break;
          case 'Subheader (% off — 2-line)':
            ukText = 'Up to 40% off';
            de = 'Spare bis\nzu 40 %';
            fr = '';
            es = 'Ahorra hasta\nun 45 %';
            break;
          case 'Date (1-line)':
            ukText = '21 Nov–2 Dec';
            de = '21. Nov. - 2. Dez.';
            fr = '21 nov.-2 déc.';
            es = '21 nov. - 2 dic.';
            break;
          case 'Date (2-line)':
            ukText = '';
            de = '';
            fr = '';
            es = '';
            break;
          case 'CTA':
            ukText = 'Learn more';
            de = 'Mehr erfahren';
            fr = 'En savoir plus';
            es = 'Ver más';
            break;
          case 'Legal':
            ukText = 'Selected products only';
            de = 'Nur auf ausgewählte Produkte';
            fr = 'Uniquement sur une sélection de produits';
            es = 'Más información en Amazon.es';
            break;
          case 'Legal - (2 lines)':
            ukText = 'Selected products only';
            de = 'Nur auf ausgewählte Produkte';
            fr = 'Uniquement sur\nune sélection\nde produits';
            es = 'Más información\nen Amazon.es';
            break;
          case 'Box Logo':
            ukText = 'amazon + smile';
            de = 'amazon + smile';
            fr = 'amazon + smile';
            es = 'amazon + smile';
            break;
          default:
            break;
        }
        rows.push({
          id: id++,
          section: section.name,
          topic,
          ukText,
          translations: { de, fr, es },
        });
      } else {
        // Other sections remain empty
        rows.push({
          id: id++,
          section: section.name,
          topic,
          ukText: '',
          translations: { de: '', fr: '', es: '' },
        });
      }
    }
  }
  return rows;
}

// Static list of rules for the combobox
const RULES = [
  'Brand guidelines v1.2',
  'Cultural Recommandations - Global v7',
  'Cultural Recommandations - Latin Countries v1',
  'Cultural Recommandations - Nordics v1',
  'Predefined Translations - Global v3',
];

const COMMON_CAMPAIGNS = [
  'Black Friday',
  'Prime Day',
  'Cyber Monday',
  'Spring Sale',
  'Back to School',
  'Holiday Deals',
  'Summer Sale',
];

// Store original Lead-up DE, FR, and ES translations by row ID for translation reset
const ORIGINAL_LEADUP_TRANSLATIONS: Record<number, { de: string; fr: string; es: string }> = (() => {
  const rows = generateInitialRows();
  const map: Record<number, { de: string; fr: string; es: string }> = {};
  for (const row of rows) {
    if (row.section === 'Lead-up') {
      map[row.id] = { de: row.translations.de, fr: row.translations.fr, es: row.translations.es };
    }
  }
  return map;
})();

// --- Main Component ---
const CampaignTable: React.FC<CampaignTableProps> = ({ campaignName: initialCampaignName = 'Black Friday' }) => {
  // State for campaign rows
  const [rows, setRows] = useState<CampaignRow[]>(generateInitialRows());
  // Set all sections collapsed by default
  const [collapsed, setCollapsed] = useState<{ [section: string]: boolean }>(
    () => {
      const state: { [section: string]: boolean } = {};
      for (const section of SECTIONS) {
        state[section.name] = true; // all collapsed by default
      }
      return state;
    }
  );
  // State for selected channel
  const [channel, setChannel] = useState(CHANNELS[0]);
  // State for campaign name (combobox with suggestions and free entry)
  const [campaignName, setCampaignName] = useState<string>(initialCampaignName);
  const [campaignPopoverOpen, setCampaignPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // State for loading (translation)
  const [loading, setLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [translated, setTranslated] = useState(false);
  // State for selected rules (multi-selection)
  const [selectedRules, setSelectedRules] = useState<string[]>([]);

  // Loading messages for the Translate button
  const loadingMessages = [
    'Applying rules…',
    'Working hard…',
    'Almost done…',
  ];

  // Cycle through loading messages while loading
  useEffect(() => {
    if (!loading) return;
    if (loadingMsgIdx >= loadingMessages.length - 1) return;
    const timeout = setTimeout(() => {
      setLoadingMsgIdx(idx => idx + 1);
    }, 900);
    return () => clearTimeout(timeout);
  }, [loading, loadingMsgIdx]);

  // Handle UK English text change
  const handleUkTextChange = (id: number, value: string) => {
    setRows(rows =>
      rows.map(row =>
        row.id === id ? { ...row, ukText: value } : row
      )
    );
  };

  // Handle section collapse/expand
  const toggleSection = (section: string) => {
    setCollapsed(c => ({ ...c, [section]: !c[section] }));
  };

  // Mock translation logic
  const handleTranslate = () => {
    // If already translated, reset translations to empty before translating again
    if (translated) {
      setRows(rows =>
        rows.map(row => ({
          ...row,
          translations: { de: '', fr: '', es: '' },
        }))
      );
      setTranslated(false);
    }
    setLoading(true);
    setLoadingMsgIdx(0);
    // Simulate translation delay and cycling messages
    setTimeout(() => {
      setRows(rows =>
        rows.map(row => ({
          ...row,
          translations: {
            // For 'Lead-up', use original DE/FR/ES; for others, use UK text or special case
            de: row.section === 'Lead-up'
              ? ORIGINAL_LEADUP_TRANSLATIONS[row.id]?.de || ''
              : row.ukText === 'Black Friday Week' && row.ukText
                ? 'Black Friday Woche'
                : row.ukText
                ? row.ukText
                : '',
            fr: row.section === 'Lead-up'
              ? ORIGINAL_LEADUP_TRANSLATIONS[row.id]?.fr || ''
              : row.ukText ? row.ukText : '',
            es: row.section === 'Lead-up'
              ? ORIGINAL_LEADUP_TRANSLATIONS[row.id]?.es || ''
              : row.ukText ? row.ukText : '',
          },
        }))
      );
      setLoading(false);
      setTranslated(true);
    }, 2700); // Simulate API delay (3 loading messages)
  };

  // Handler for selecting/clearing rules from the combobox
  const handleSelectRule = (rules: string[]) => {
    setSelectedRules(rules);
  };

  // --- Render ---
  return (
    <div className="w-full max-w-full overflow-x-auto p-4">
      {/* Header row with campaign name, channel selector, translate/download buttons (left), and Rules combobox (right) */}
      <div className="flex items-center mb-4 flex-wrap gap-2 justify-between">
        {/* Left group: Campaign, campaign selector, channel selector, translate/download buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="font-semibold text-lg">Campaign</span>
          {/* Campaign name combobox with suggestions and free entry */}
          <Popover open={campaignPopoverOpen} onOpenChange={setCampaignPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={campaignPopoverOpen}
                className="w-[200px] justify-between text-sm"
              >
                {campaignName || 'Select campaign...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-0">
              <Command>
                <CommandInput
                  ref={inputRef}
                  value={campaignName}
                  onValueChange={setCampaignName}
                  placeholder="Search or type campaign..."
                  className="h-9"
                />
                <CommandList>
                  <CommandEmpty>No campaign found.</CommandEmpty>
                  <CommandGroup>
                    {COMMON_CAMPAIGNS.map((c) => (
                      <CommandItem
                        key={c}
                        value={c}
                        onSelect={() => {
                          setCampaignName(c);
                          setCampaignPopoverOpen(false);
                        }}
                      >
                        {c}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {/* Channel Selector using shadcn/ui Select, label visually hidden but accessible */}
          <label htmlFor="channel" className="sr-only">Channel:</label>
          <Select value={channel} onValueChange={setChannel} name="channel">
            <SelectTrigger id="channel" className="w-[200px]">
              <SelectValue placeholder="Select channel..." />
            </SelectTrigger>
            <SelectContent>
              {CHANNELS.map(ch => (
                <SelectItem key={ch} value={ch}>{ch}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Translate button now appears after the channel combobox */}
          <Button onClick={handleTranslate} disabled={loading} className="gap-2">
            {/* Show spinning Loader2 icon when loading, otherwise Sparkles icon. Medium gap between icon and text. */}
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? loadingMessages[loadingMsgIdx] : 'Translate'}
          </Button>
          {/* Download button appears after translation is complete */}
          {translated && (
            <Button variant="outline" className="ml-2">Download as .xlsx</Button>
          )}
        </div>
        {/* Right group: Rules Combobox */}
        <div className="flex items-center">
          {/* Rules Combobox: multi-selection, right-aligned */}
          <RuleCombobox
            options={RULES}
            value={selectedRules}
            onSelect={handleSelectRule}
          />
        </div>
      </div>

      {/* Download Button row can be added here if needed */}

      {/* Campaign Table */}
      <table className="min-w-[900px] border-collapse w-full">
        <thead>
          <tr>
            {/* Make Topic column fixed width to match other columns */}
            <th className="border px-2 py-1 w-[300px] text-sm text-left">Topic</th>
            <th className="border px-2 py-1 w-[300px] text-sm text-left">UK English</th>
            {LOCALES.map(locale => (
              <th key={locale.code} className="border px-2 py-1 w-[300px] text-sm text-left">{locale.label}</th>
            ))}
          </tr>
        </thead>
        {/* Sizer row to reserve column widths and prevent layout shift */}
        <tbody aria-hidden="true" hidden>
          <tr>
            <td className="w-[300px]" style={{height: 0, padding: 0, border: 0}} />
            {LOCALES.map(locale => (
              <td key={locale.code} className="w-[300px]" style={{height: 0, padding: 0, border: 0}} />
            ))}
          </tr>
        </tbody>
        <tbody>
          {SECTIONS.map(section => (
            <React.Fragment key={section.name}>
              {/* Section Header Row (collapsible) */}
              <tr className="bg-gray-100">
                <td colSpan={LOCALES.length + 2} className="font-semibold cursor-pointer" onClick={() => toggleSection(section.name)}>
                  {collapsed[section.name] ? '▶' : '▼'} {section.name}
                </td>
              </tr>
              {/* Section Topic Rows */}
              {!collapsed[section.name] &&
                rows.filter(row => row.section === section.name).map(row => (
                  <tr key={row.id}>
                    {/* Make Topic cell compact as well, but with text-sm for readability */}
                    <td className="border px-2 py-1 w-36 text-sm whitespace-nowrap align-top text-left">{row.topic}</td>
                    <td className="border px-2 py-1 w-[300px] bg-gray-50">
                      {/* Use shadcn/ui Textarea, borderless and minimal */}
                      <Textarea
                        className="w-full min-w-[120px] border-none focus:ring-0 resize-none text-sm bg-transparent !bg-transparent shadow-none"
                        value={row.ukText}
                        onChange={e => handleUkTextChange(row.id, e.target.value)}
                        rows={1}
                        placeholder="Enter UK English copy..."
                        disabled={loading}
                        style={{ padding: 0 }}
                      />
                    </td>
                    {/* DE/AT merged column now only uses de translation */}
                    <td
                      className={`border px-2 py-1 w-[300px] text-sm align-top text-left ${!row.translations.de ? 'bg-gray-50 text-gray-400' : ''}`}
                    >
                      {(!translated || !row.translations.de)
                        ? '—'
                        : row.translations.de}
                    </td>
                    {/* FR column */}
                    <td
                      className={`border px-2 py-1 w-[300px] text-sm align-top text-left ${!row.translations.fr ? 'bg-gray-50 text-gray-400' : ''}`}
                    >
                      {(!translated || !row.translations.fr) ? '—' : row.translations.fr}
                    </td>
                    {/* ES column */}
                    <td
                      className={`border px-2 py-1 w-[300px] text-sm align-top text-left ${!row.translations.es ? 'bg-gray-50 text-gray-400' : ''}`}
                    >
                      {(!translated || !row.translations.es) ? '—' : row.translations.es}
                    </td>
                  </tr>
                ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CampaignTable; 