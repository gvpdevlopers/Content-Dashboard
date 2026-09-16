import ContactHero from "../components/public/contact/ContactHero";
import ContactInfo from "../components/public/contact/ContactInfo";
import ContactForm from "../components/public/contact/ContactForm";
import ContactCTA from "../components/public/contact/ContactCTA";

const Contact = () => {
  return (
    <>
      <ContactHero />

      <section className="bg-white">
        <div className="mx-auto grid w-full max-w-[1400px] gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20 lg:px-8 lg:py-28">
          <ContactInfo />
          <ContactForm />
        </div>
      </section>

      <ContactCTA />
    </>
  );
};

export default Contact;