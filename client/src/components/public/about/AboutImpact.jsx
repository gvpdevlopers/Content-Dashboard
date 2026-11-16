import Section from '../Section';
import Reveal from '../Reveal';
const AboutImpact = () => <Section className="glow-perspective bg-[#f2f2f0]">
  <Reveal className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
    {[
      ['Since 2017', 'Marketing & PR', 'A connected approach to moving businesses forward.'],
      ['Three disciplines', 'One direction', 'Internet marketing, public relations, and content production.'],
      ['From idea to action', 'Built together', 'Strategy, progress, and growth guide the way we work.'],
    ].map(([label,title,copy]) => <div className="glow-perspective-item" key={label}>
      <p className="text-xs font-semibold uppercase tracking-widest">{label}</p>
      <h2 className="mt-4 text-3xl font-semibold">{title}</h2><p className="mt-3 text-sm leading-6">{copy}</p>
    </div>)}
  </Reveal>
</Section>;
export default AboutImpact;
