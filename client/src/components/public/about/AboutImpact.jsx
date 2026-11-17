import Section from "../Section";
import Reveal from "../Reveal";
import HeadingCursor from "../HeadingCursor";

const impact = [
  { value: "$4M+", label: "Client revenue" },
  { value: "1.5B+", label: "Audience reached" },
  { value: "1,500+", label: "Clients served" },
  { value: "8,500+", label: "Successful campaigns" },
];

const AboutImpact = () => (
  <Section className="bg-[#f2f2f0] !py-16 sm:!py-24 lg:!py-28">
    <div className="mx-auto max-w-6xl">
      <Reveal className="flex flex-col gap-4 border-b border-zinc-300 pb-8 sm:flex-row sm:items-end sm:justify-between sm:pb-10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500 sm:text-xs">
            The work, in perspective
          </p>
          <HeadingCursor
            as="h2"
            className="mt-3 text-3xl font-medium tracking-[-0.06em] text-zinc-950 sm:text-4xl"
          >
            A record of shared ambition.
          </HeadingCursor>
        </div>
        <p className="max-w-xs text-xs leading-5 text-zinc-500 sm:text-sm sm:leading-6">
          Figures shared by Glow Ventures across its work with clients.
        </p>
      </Reveal>

      <dl className="grid grid-cols-2 sm:grid-cols-4">
        {impact.map((item, index) => (
          <Reveal
            key={item.label}
            delay={index * 0.05}
            className="flex min-w-0 flex-col border-b border-zinc-300 py-7 even:pl-4 sm:border-b-0 sm:border-r sm:px-5 sm:py-10 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0"
          >
            <dt className="order-2 mt-3 text-[10px] font-semibold uppercase leading-4 tracking-[0.13em] text-zinc-500 sm:text-xs sm:tracking-[0.16em]">
              {item.label}
            </dt>
            <dd className="order-1 break-words text-3xl font-medium leading-none tracking-[-0.07em] text-zinc-950 sm:text-4xl lg:text-5xl">
              {item.value}
            </dd>
          </Reveal>
        ))}
      </dl>
    </div>
  </Section>
);

export default AboutImpact;
