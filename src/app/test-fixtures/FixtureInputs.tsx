'use client';

import { useState } from 'react';
import { FreeTextQuestion } from '@/components/tasting/FreeTextQuestion';
import { NumericQuestion } from '@/components/tasting/NumericQuestion';
import { DropdownQuestion } from '@/components/tasting/DropdownQuestion';
import { YesNoQuestion } from '@/components/tasting/YesNoQuestion';
import { WHISKEY_TYPES } from '@/lib/constants/whiskeyTypes';

export function FixtureInputs() {
  const [text, setText] = useState('Buffalo Trace');
  const [textEmpty, setTextEmpty] = useState('');
  const [numeric, setNumeric] = useState('12');
  const [numericEmpty, setNumericEmpty] = useState('');
  const [dropdown, setDropdown] = useState('Bourbon');
  const [yesNo, setYesNo] = useState<'yes' | 'no'>('no');
  const [yesNoYes, setYesNoYes] = useState<'yes' | 'no'>('yes');

  return (
    <section id="section-question-inputs">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-smoke mb-4">Question Inputs</h2>
      <div className="grid grid-cols-2 gap-6 max-w-xl">
        <div className="space-y-2">
          <p className="text-xs text-[#999]">Free text — filled</p>
          <FreeTextQuestion value={text} onChange={setText} placeholder="e.g. Buffalo Trace" />
        </div>
        <div className="space-y-2">
          <p className="text-xs text-[#999]">Free text — empty</p>
          <FreeTextQuestion value={textEmpty} onChange={setTextEmpty} placeholder="e.g. Buffalo Trace" />
        </div>
        <div className="space-y-2">
          <p className="text-xs text-[#999]">Numeric — filled</p>
          <NumericQuestion value={numeric} onChange={setNumeric} placeholder="0" />
        </div>
        <div className="space-y-2">
          <p className="text-xs text-[#999]">Numeric — empty</p>
          <NumericQuestion value={numericEmpty} onChange={setNumericEmpty} placeholder="0" />
        </div>
        <div className="space-y-2">
          <p className="text-xs text-[#999]">Dropdown</p>
          <DropdownQuestion
            value={dropdown}
            options={WHISKEY_TYPES.map(t => ({ value: t, label: t }))}
            onChange={setDropdown}
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs text-[#999]">Yes/No — No selected</p>
          <YesNoQuestion value={yesNo} onChange={setYesNo} />
        </div>
        <div className="space-y-2 col-span-2 max-w-xs">
          <p className="text-xs text-[#999]">Yes/No — Yes selected</p>
          <YesNoQuestion value={yesNoYes} onChange={setYesNoYes} />
        </div>
      </div>
    </section>
  );
}
