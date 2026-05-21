// Only available outside production — used by Playwright visual regression tests
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

export default function TestFixturesPage() {
  if (process.env.NODE_ENV === 'production') {
    redirect('/');
  }

  return (
    <div className="p-8 space-y-12 min-h-screen">

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-smoke mb-4">Button</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap gap-3 items-center mt-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-smoke mb-4">Badge</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <Badge variant="default">Default</Badge>
          <Badge variant="green">Green</Badge>
          <Badge variant="amber">Amber</Badge>
          <Badge variant="grey">Grey</Badge>
          <Badge variant="blue">Blue</Badge>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-smoke mb-4">Input</h2>
        <div className="flex flex-col gap-3 max-w-xs">
          <Input placeholder="Placeholder text" />
          <Input defaultValue="Filled value" />
          <Input disabled placeholder="Disabled" />
        </div>
      </section>

    </div>
  );
}
